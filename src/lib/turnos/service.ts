import { randomUUID } from "crypto";
import { resolveAgendaForEmpresaSlot } from "@/lib/agenda/resolve";
import connectDB from "@/lib/db";
import { sendTurnoInviteEmail } from "@/lib/mail/turno-invite";
import { notifyTurnoActualizado } from "@/lib/realtime/notify";
import { buildEmpresaScopedQuery } from "@/lib/security/idor";
import { TurnoValidationError } from "@/lib/turnos/errors";
import {
  computeTokenWindow,
  createPatientAccessToken,
} from "@/lib/turnos/patient-token";
import type { createTurnoSchema } from "@/lib/validations/turnos";
import { Paciente, Turno } from "@/models";
import type { z } from "zod";

export { TurnoValidationError } from "@/lib/turnos/errors";

type CreateTurnoInput = z.infer<typeof createTurnoSchema>;

function buildConsultaUrl(accessToken: string): string {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${baseUrl}/consulta/${encodeURIComponent(accessToken)}`;
}

function withConsultaUrl<T extends { accessToken?: string }>(turno: T) {
  if (!turno.accessToken) {
    return turno;
  }

  return {
    ...turno,
    consultaUrl: buildConsultaUrl(turno.accessToken),
  };
}

export async function findOrCreatePaciente(
  empresaId: string,
  paciente: CreateTurnoInput["paciente"],
) {
  const email = paciente.email.toLowerCase();
  const telefono = paciente.telefono.trim();

  const existing = await Paciente.findOne({
    empresaId,
    $or: [{ email }, { telefono }],
  });

  if (existing) {
    existing.nombre = paciente.nombre;
    existing.apellido = paciente.apellido;
    existing.domicilio = paciente.domicilio;
    existing.telefono = telefono;
    existing.email = email;
    if (paciente.descripcion) {
      existing.descripcion = paciente.descripcion;
    }
    await existing.save();
    return existing;
  }

  return Paciente.create({
    ...paciente,
    email,
    telefono,
    empresaId,
  });
}

export async function createTurnoForEmpresa(
  empresaId: string,
  input: CreateTurnoInput,
) {
  await connectDB();

  const fechaHoraProgramada = new Date(input.fechaHoraProgramada);

  if (Number.isNaN(fechaHoraProgramada.getTime())) {
    throw new TurnoValidationError("Fecha/hora inválida");
  }

  if (fechaHoraProgramada.getTime() < Date.now()) {
    throw new TurnoValidationError("No podés agendar turnos en el pasado");
  }

  const agenda = await resolveAgendaForEmpresaSlot(
    empresaId,
    fechaHoraProgramada,
    input.agendaId,
  );

  const paciente = await findOrCreatePaciente(empresaId, input.paciente);
  const { tokenExpiraEn } = computeTokenWindow(fechaHoraProgramada);

  const turnoDraft = await Turno.create({
    pacienteId: paciente._id,
    empresaId,
    agendaId: agenda._id,
    fechaHoraProgramada,
    estado: "pendiente",
    accessToken: `pending-${randomUUID()}`,
    tokenExpiraEn,
  });

  const accessToken = await createPatientAccessToken(
    turnoDraft._id.toString(),
    tokenExpiraEn,
  );

  turnoDraft.accessToken = accessToken;
  await turnoDraft.save();

  const consultaUrl = buildConsultaUrl(accessToken);

  const mailSent = await sendTurnoInviteEmail(paciente.email, {
    pacienteNombre: paciente.nombre,
    fechaHora: fechaHoraProgramada,
    consultaUrl,
  });

  notifyTurnoActualizado(turnoDraft);

  return { turno: turnoDraft, mailSent, consultaUrl };
}

export async function listTurnosForEmpresa(
  empresaId: string,
  filters: { estado?: string; desde?: Date; hasta?: Date },
) {
  await connectDB();

  const query = buildEmpresaScopedQuery(empresaId, {} as Record<string, unknown>);

  if (filters.estado) {
    query.estado = filters.estado;
  }

  if (filters.desde || filters.hasta) {
    query.fechaHoraProgramada = {
      ...(filters.desde ? { $gte: filters.desde } : {}),
      ...(filters.hasta ? { $lte: filters.hasta } : {}),
    };
  }

  const turnos = await Turno.find(query)
    .populate("pacienteId", "nombre apellido email telefono")
    .populate("profesionalId", "nombre apellido")
    .populate("agendaId", "nombre fecha horaInicio horaFin duracionTurnoMinutos")
    .sort({ fechaHoraProgramada: -1 })
    .lean();

  return turnos.map((turno) => withConsultaUrl(turno));
}

export async function cancelTurnoForEmpresa(turnoId: string, empresaId: string) {
  await connectDB();

  const turno = await Turno.findOne({ _id: turnoId, empresaId });

  if (!turno) {
    return null;
  }

  if (turno.estado === "en_curso" || turno.estado === "finalizado") {
    throw new TurnoValidationError(
      "No podés cancelar un turno en curso o finalizado",
    );
  }

  if (turno.estado === "cancelado") {
    return turno;
  }

  turno.estado = "cancelado";
  await turno.save();
  notifyTurnoActualizado(turno);
  return turno;
}
