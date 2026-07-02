import { Types } from "mongoose";
import { canEmpresaAccessAgenda } from "@/lib/agenda/access";
import {
  getAgendaDayKey,
  parseAgendaDayKey,
} from "@/lib/agenda/slots";
import {
  getAgendaDayRange,
  mapAgendaSlotStatuses,
} from "@/lib/agenda/slot-status";
import connectDB from "@/lib/db";
import { TurnoValidationError } from "@/lib/turnos/errors";
import { Agenda, Turno } from "@/models";

export function buildEmpresaAgendaFilter(
  empresaId: string,
  fromDate: Date = new Date(),
) {
  const fechaMin = parseAgendaDayKey(getAgendaDayKey(fromDate));

  return {
    activa: true,
    fecha: { $gte: fechaMin },
    $or: [
      { empresaIds: { $size: 0 } },
      { empresaIds: new Types.ObjectId(empresaId) },
    ],
  };
}

export async function listAgendasForEmpresa(empresaId: string) {
  await connectDB();

  return Agenda.find(buildEmpresaAgendaFilter(empresaId))
    .select("nombre fecha horaInicio horaFin duracionTurnoMinutos empresaIds activa")
    .sort({ fecha: 1, horaInicio: 1 })
    .lean();
}

export async function getAgendaSlotsForEmpresa(empresaId: string, agendaId: string) {
  await connectDB();

  const agenda = await Agenda.findById(agendaId).lean();
  if (!agenda || !agenda.activa) {
    return null;
  }

  if (!canEmpresaAccessAgenda(empresaId, agenda)) {
    throw new TurnoValidationError("No tenés acceso a esa agenda");
  }

  const { desde, hasta } = getAgendaDayRange(agenda.fecha);
  const turnos = await Turno.find({
    agendaId,
    fechaHoraProgramada: { $gte: desde, $lte: hasta },
    estado: { $nin: ["cancelado"] },
  })
    .select("fechaHoraProgramada estado")
    .lean();

  const slots = mapAgendaSlotStatuses(
    agenda.horaInicio,
    agenda.horaFin,
    agenda.duracionTurnoMinutos,
    turnos,
  );

  return { agenda, slots };
}
