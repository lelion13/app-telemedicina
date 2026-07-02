import connectDB from "@/lib/db";
import { Turno } from "@/models";

export type ListAdministrativoTurnosFilters = {
  agendaId?: string;
  estado?: string;
  desde?: Date;
  hasta?: Date;
};

export async function listAdministrativoTurnos(
  filters: ListAdministrativoTurnosFilters,
) {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (filters.agendaId) {
    query.agendaId = filters.agendaId;
  }

  if (filters.estado) {
    query.estado = filters.estado;
  }

  if (filters.desde || filters.hasta) {
    query.fechaHoraProgramada = {
      ...(filters.desde ? { $gte: filters.desde } : {}),
      ...(filters.hasta ? { $lte: filters.hasta } : {}),
    };
  }

  return Turno.find(query)
    .populate("pacienteId", "nombre apellido email telefono")
    .populate("profesionalId", "nombre apellido")
    .populate("empresaId", "nombre")
    .populate("agendaId", "nombre fecha horaInicio horaFin duracionTurnoMinutos")
    .sort({ fechaHoraProgramada: -1 })
    .lean();
}
