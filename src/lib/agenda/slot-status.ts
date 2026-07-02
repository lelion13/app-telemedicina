import { generateSlots, getAgendaDayKey, getHoraSlot } from "@/lib/agenda/slots";

export type SlotTurnoRef = {
  fechaHoraProgramada: Date;
  estado: string;
  _id: { toString(): string };
};

export type AgendaSlotStatus = {
  hora: string;
  ocupado: boolean;
  turnoId?: string;
  estado?: string;
};

export function mapAgendaSlotStatuses(
  horaInicio: string,
  horaFin: string,
  duracionTurnoMinutos: number,
  turnos: SlotTurnoRef[],
): AgendaSlotStatus[] {
  const slots = generateSlots(horaInicio, horaFin, duracionTurnoMinutos);
  const occupiedByHora = new Map<string, SlotTurnoRef>();

  for (const turno of turnos) {
    occupiedByHora.set(getHoraSlot(turno.fechaHoraProgramada), turno);
  }

  return slots.map((hora) => {
    const turno = occupiedByHora.get(hora);

    return {
      hora,
      ocupado: Boolean(turno),
      turnoId: turno?._id.toString(),
      estado: turno?.estado,
    };
  });
}

export function getAgendaDayRange(fecha: Date): { desde: Date; hasta: Date } {
  const dayKey = getAgendaDayKey(fecha);
  return {
    desde: new Date(`${dayKey}T00:00:00-03:00`),
    hasta: new Date(`${dayKey}T23:59:59.999-03:00`),
  };
}
