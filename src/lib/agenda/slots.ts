import { getHoraArgentina } from "@/lib/turnos/franja";

export const ARGENTINA_TZ = "America/Argentina/Buenos_Aires";

export function timeToMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function generateSlots(
  horaInicio: string,
  horaFin: string,
  duracionTurnoMinutos: number,
): string[] {
  const start = timeToMinutes(horaInicio);
  const end = timeToMinutes(horaFin);
  const slots: string[] = [];

  for (let cursor = start; cursor + duracionTurnoMinutos <= end; cursor += duracionTurnoMinutos) {
    slots.push(minutesToTime(cursor));
  }

  return slots;
}

export function getAgendaDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseAgendaDayKey(dayKey: string): Date {
  return new Date(`${dayKey}T12:00:00.000Z`);
}

export function isSameAgendaDay(a: Date, b: Date): boolean {
  return getAgendaDayKey(a) === getAgendaDayKey(b);
}

export type AgendaSlotConfig = {
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  duracionTurnoMinutos: number;
};

export function matchesAgendaSlot(
  fechaHoraProgramada: Date,
  agenda: AgendaSlotConfig,
): boolean {
  if (!isSameAgendaDay(fechaHoraProgramada, agenda.fecha)) {
    return false;
  }

  const hora = getHoraArgentina(fechaHoraProgramada);
  const slots = generateSlots(
    agenda.horaInicio,
    agenda.horaFin,
    agenda.duracionTurnoMinutos,
  );

  return slots.includes(hora);
}

export function getHoraSlot(fechaHoraProgramada: Date): string {
  return getHoraArgentina(fechaHoraProgramada);
}

export function buildSlotDateTime(agendaFecha: Date | string, hora: string): Date {
  const dayKey =
    typeof agendaFecha === "string"
      ? getAgendaDayKey(new Date(agendaFecha))
      : getAgendaDayKey(agendaFecha);

  return new Date(`${dayKey}T${hora}:00-03:00`);
}
