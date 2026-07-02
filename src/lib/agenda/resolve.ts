import type { HydratedDocument } from "mongoose";
import { canEmpresaAccessAgenda } from "@/lib/agenda/access";
import {
  getAgendaDayKey,
  matchesAgendaSlot,
  parseAgendaDayKey,
} from "@/lib/agenda/slots";
import connectDB from "@/lib/db";
import { TurnoValidationError } from "@/lib/turnos/errors";
import { Agenda, Turno, type IAgenda } from "@/models";

type AgendaDocument = HydratedDocument<IAgenda>;

export async function isAgendaSlotOccupied(
  agendaId: string,
  fechaHoraProgramada: Date,
): Promise<boolean> {
  const existing = await Turno.findOne({
    agendaId,
    fechaHoraProgramada,
    estado: { $nin: ["cancelado"] },
  })
    .select("_id")
    .lean();

  return Boolean(existing);
}

export async function resolveAgendaForEmpresaSlot(
  empresaId: string,
  fechaHoraProgramada: Date,
  explicitAgendaId?: string,
): Promise<AgendaDocument> {
  await connectDB();

  if (explicitAgendaId) {
    const agenda = await Agenda.findById(explicitAgendaId);

    if (!agenda || !agenda.activa) {
      throw new TurnoValidationError("La agenda seleccionada no está disponible");
    }

    if (!canEmpresaAccessAgenda(empresaId, agenda)) {
      throw new TurnoValidationError("No tenés acceso a esa agenda");
    }

    if (!matchesAgendaSlot(fechaHoraProgramada, agenda)) {
      throw new TurnoValidationError(
        "El horario elegido no coincide con un turno disponible en esa agenda",
      );
    }

    if (await isAgendaSlotOccupied(agenda._id.toString(), fechaHoraProgramada)) {
      throw new TurnoValidationError("Ese horario ya está ocupado");
    }

    return agenda;
  }

  const fecha = parseAgendaDayKey(getAgendaDayKey(fechaHoraProgramada));
  const agendas = await Agenda.find({
    activa: true,
    fecha,
  });

  const candidates = agendas.filter(
    (agenda) =>
      canEmpresaAccessAgenda(empresaId, agenda) &&
      matchesAgendaSlot(fechaHoraProgramada, agenda),
  );

  for (const agenda of candidates) {
    if (!(await isAgendaSlotOccupied(agenda._id.toString(), fechaHoraProgramada))) {
      return agenda;
    }
  }

  throw new TurnoValidationError(
    "El horario elegido no está dentro de una agenda disponible",
  );
}
