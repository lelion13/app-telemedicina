import connectDB from "@/lib/db";
import { logConsultaEvent } from "@/lib/consulta/audit";
import { notifyTurnoActualizado } from "@/lib/realtime/notify";
import { TurnoValidationError } from "@/lib/turnos/service";
import {
  canCloseConsulta,
  canStartConsulta,
  canTakeTurno,
  nextEstadoAfterStart,
  nextEstadoAfterTake,
} from "@/lib/turnos/state";
import { Turno } from "@/models";
import type { TurnoEstado } from "@/models/types";
import { Types } from "mongoose";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function listTurnosForProfesional(filters: {
  estado?: TurnoEstado;
  empresaId?: string;
  soloHoy?: boolean;
  desde?: Date;
  hasta?: Date;
}) {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (filters.estado) {
    query.estado = filters.estado;
  }

  if (filters.empresaId) {
    query.empresaId = filters.empresaId;
  }

  if (filters.soloHoy) {
    query.fechaHoraProgramada = {
      $gte: startOfToday(),
      $lte: endOfToday(),
    };
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

  turno.estado = nextEstadoAfterStart();
  await turno.save();
  await logConsultaEvent(turnoId, "llamada_iniciada", { rol: "profesional" });
  notifyTurnoActualizado(turno);

  return turno;
}

export async function closeTurno(
  turnoId: string,
  profesionalId: string,
  estado: "finalizado" | "ausente",
  notasProfesional?: string,
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
  if (notasProfesional?.trim()) {
    turno.notasProfesional = notasProfesional.trim();
  }
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
    .populate("profesionalId", "nombre apellido");

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
