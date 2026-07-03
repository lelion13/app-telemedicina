import connectDB from "@/lib/db";
import { getAgendaDayRange } from "@/lib/agenda/slot-status";
import { getAgendaDayKey, parseAgendaDayKey } from "@/lib/agenda/slots";
import { logConsultaEvent } from "@/lib/consulta/audit";
import { getActiveAgendaIds } from "@/lib/agenda/active";
import { notifyTurnoActualizado } from "@/lib/realtime/notify";
import { TurnoValidationError } from "@/lib/turnos/errors";
import { buildEvolucionPayload } from "@/lib/turnos/evolucion";
import { getPatientLinkWindow } from "@/lib/turnos/patient-window";
import {
  canCloseConsulta,
  canStartConsulta,
  canTakeTurno,
  nextEstadoAfterStart,
  nextEstadoAfterTake,
} from "@/lib/turnos/state";
import { Agenda, RegistroGPS, Turno } from "@/models";
import type { TurnoEstado } from "@/models/types";
import { Types } from "mongoose";

function getTodayRangeArgentina(): { desde: Date; hasta: Date } {
  return getAgendaDayRange(parseAgendaDayKey(getAgendaDayKey(new Date())));
}

async function assertTurnoOnActiveAgenda(turno: { agendaId?: Types.ObjectId | null }) {
  if (!turno.agendaId) {
    throw new TurnoValidationError("El turno no pertenece a una agenda activa");
  }

  const agenda = await Agenda.findById(turno.agendaId).select("activa").lean();
  if (!agenda?.activa) {
    throw new TurnoValidationError("La agenda de este turno no está activa");
  }
}

export async function listTurnosForProfesional(filters: {
  estado?: TurnoEstado;
  empresaId?: string;
  soloHoy?: boolean;
  desde?: Date;
  hasta?: Date;
}) {
  await connectDB();

  const activeAgendaIds = await getActiveAgendaIds(
    filters.soloHoy ? parseAgendaDayKey(getAgendaDayKey(new Date())) : new Date(),
  );

  if (activeAgendaIds.length === 0) {
    return [];
  }

  const query: Record<string, unknown> = {
    agendaId: { $in: activeAgendaIds },
  };

  if (filters.estado) {
    query.estado = filters.estado;
  }

  if (filters.empresaId) {
    query.empresaId = filters.empresaId;
  }

  if (filters.soloHoy) {
    const { desde, hasta } = getTodayRangeArgentina();
    query.fechaHoraProgramada = { $gte: desde, $lte: hasta };
  } else if (filters.desde || filters.hasta) {
    query.fechaHoraProgramada = {
      ...(filters.desde ? { $gte: filters.desde } : {}),
      ...(filters.hasta ? { $lte: filters.hasta } : {}),
    };
  }

  return Turno.find(query)
    .populate("pacienteId", "nombre apellido email telefono domicilio descripcion")
    .populate("profesionalId", "nombre apellido")
    .populate("empresaId", "nombre")
    .populate("agendaId", "nombre fecha horaInicio horaFin duracionTurnoMinutos activa")
    .sort({ fechaHoraProgramada: 1 })
    .lean();
}

export async function takeTurno(turnoId: string, profesionalId: string) {
  await connectDB();

  const turno = await Turno.findById(turnoId);
  if (!turno) {
    return null;
  }

  if (!canTakeTurno(turno)) {
    throw new TurnoValidationError("Este turno no está disponible para tomar");
  }

  await assertTurnoOnActiveAgenda(turno);

  turno.profesionalId = new Types.ObjectId(profesionalId);
  turno.estado = nextEstadoAfterTake();
  await turno.save();
  notifyTurnoActualizado(turno);

  return turno;
}

export async function startTurno(turnoId: string, profesionalId: string) {
  await connectDB();

  const turno = await Turno.findById(turnoId);
  if (!turno) {
    return null;
  }

  if (!canStartConsulta(turno, profesionalId)) {
    throw new TurnoValidationError("No podés iniciar esta consulta");
  }

  await assertTurnoOnActiveAgenda(turno);

  turno.estado = nextEstadoAfterStart();
  await turno.save();
  await logConsultaEvent(turnoId, "llamada_iniciada", { rol: "profesional" });
  notifyTurnoActualizado(turno);

  return turno;
}

export async function saveEvolucionForTurno(
  turnoId: string,
  profesionalId: string,
  evolucionTexto: string,
) {
  await connectDB();

  const turno = await Turno.findById(turnoId);
  if (!turno) {
    return null;
  }

  if (
    turno.profesionalId?.toString() !== profesionalId ||
    turno.estado !== "en_curso"
  ) {
    throw new TurnoValidationError("No podés registrar evolución en esta consulta");
  }

  const gpsRegistro = await RegistroGPS.findOne({ turnoId })
    .sort({ timestamp: -1 })
    .select("_id")
    .lean();

  turno.evolucion = buildEvolucionPayload({
    texto: evolucionTexto,
    gpsRegistroId: gpsRegistro?._id,
  });
  turno.notasProfesional = evolucionTexto.trim();
  await turno.save();

  return turno;
}

export async function closeTurno(
  turnoId: string,
  profesionalId: string,
  estado: "finalizado" | "ausente",
  evolucionTexto?: string,
) {
  await connectDB();

  const turno = await Turno.findById(turnoId);
  if (!turno) {
    return null;
  }

  if (!canCloseConsulta(turno, profesionalId)) {
    throw new TurnoValidationError("No podés cerrar esta consulta");
  }

  turno.estado = estado;

  const texto = evolucionTexto?.trim() ?? turno.evolucion?.texto?.trim();
  if (!texto) {
    throw new TurnoValidationError(
      estado === "finalizado"
        ? "La evolución es obligatoria al finalizar la consulta"
        : "La evolución es obligatoria al marcar ausente",
    );
  }

  const gpsRegistro = await RegistroGPS.findOne({ turnoId })
    .sort({ timestamp: -1 })
    .select("_id")
    .lean();

  turno.evolucion = buildEvolucionPayload({
    texto,
    gpsRegistroId: gpsRegistro?._id,
  });
  turno.notasProfesional = texto;

  await turno.save();
  await logConsultaEvent(turnoId, "llamada_finalizada", { estado });
  notifyTurnoActualizado(turno);

  return turno;
}

export async function getTurnoForProfesional(turnoId: string, profesionalId: string) {
  await connectDB();

  const turno = await Turno.findById(turnoId)
    .populate("pacienteId")
    .populate("empresaId", "nombre")
    .populate("profesionalId", "nombre apellido")
    .populate("agendaId", "nombre fecha horaInicio horaFin");

  if (!turno) {
    return null;
  }

  if (
    turno.profesionalId &&
    turno.profesionalId.toString() !== profesionalId
  ) {
    return null;
  }

  return turno;
}

export function buildProfesionalTurnoConsultaMeta(turno: {
  fechaHoraProgramada: Date;
  tokenExpiraEn: Date;
}) {
  const ventanaPaciente = getPatientLinkWindow(
    turno.fechaHoraProgramada,
    turno.tokenExpiraEn,
  );

  return {
    ventanaPaciente: {
      status: ventanaPaciente.status,
      validFrom: ventanaPaciente.validFrom.toISOString(),
      tokenExpiraEn: ventanaPaciente.tokenExpiraEn.toISOString(),
    },
  };
}
