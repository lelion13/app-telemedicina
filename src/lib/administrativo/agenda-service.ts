import connectDB from "@/lib/db";
import {
  getAgendaDayRange,
  mapAgendaSlotStatuses,
} from "@/lib/agenda/slot-status";
import { normalizeAgendaDateInput } from "@/lib/agenda/slots";
import type { agendaInputSchema, agendaUpdateSchema } from "@/lib/validations/agenda";
import { Agenda, Turno } from "@/models";
import type { z } from "zod";
import { Types } from "mongoose";

type AgendaCreateInput = z.infer<typeof agendaInputSchema>;
type AgendaUpdateInput = z.infer<typeof agendaUpdateSchema>;

export type ListAgendasFilters = {
  activa?: boolean;
  desde?: Date;
  hasta?: Date;
};

function normalizeAgendaFecha(fechaInput: string): Date {
  return normalizeAgendaDateInput(fechaInput);
}

function toObjectIds(ids?: string[]): Types.ObjectId[] {
  return (ids ?? []).map((id) => new Types.ObjectId(id));
}

export async function listAgendas(filters: ListAgendasFilters = {}) {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (filters.activa !== undefined) {
    query.activa = filters.activa;
  }

  if (filters.desde || filters.hasta) {
    query.fecha = {
      ...(filters.desde ? { $gte: filters.desde } : {}),
      ...(filters.hasta ? { $lte: filters.hasta } : {}),
    };
  }

  return Agenda.find(query)
    .populate("creadoPorId", "nombre apellido email")
    .populate("empresaIds", "nombre")
    .sort({ fecha: -1, horaInicio: 1 })
    .lean();
}

export async function createAgenda(
  creadoPorId: string,
  input: AgendaCreateInput,
) {
  await connectDB();

  return Agenda.create({
    nombre: input.nombre,
    descripcion: input.descripcion,
    fecha: normalizeAgendaFecha(input.fecha),
    horaInicio: input.horaInicio,
    horaFin: input.horaFin,
    duracionTurnoMinutos: input.duracionTurnoMinutos,
    empresaIds: toObjectIds(input.empresaIds),
    creadoPorId,
    activa: input.activa ?? true,
  });
}

export async function updateAgenda(id: string, input: AgendaUpdateInput) {
  await connectDB();

  const update: Record<string, unknown> = { ...input };

  if (input.fecha) {
    update.fecha = normalizeAgendaFecha(input.fecha);
  }

  if (input.empresaIds) {
    update.empresaIds = toObjectIds(input.empresaIds);
  }

  return Agenda.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  })
    .populate("creadoPorId", "nombre apellido email")
    .populate("empresaIds", "nombre");
}

export async function getAgendaById(id: string) {
  await connectDB();
  return Agenda.findById(id)
    .populate("creadoPorId", "nombre apellido email")
    .populate("empresaIds", "nombre")
    .lean();
}

export async function getAgendaSlots(id: string) {
  await connectDB();

  const agenda = await Agenda.findById(id).lean();
  if (!agenda) {
    return null;
  }

  const { desde, hasta } = getAgendaDayRange(agenda.fecha);
  const turnos = await Turno.find({
    agendaId: id,
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
