import type { IFranjaHoraria } from "@/models/FranjaHoraria";

const ARGENTINA_TZ = "America/Argentina/Buenos_Aires";

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function getDiaSemanaArgentina(date: Date): number {
  const dayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: ARGENTINA_TZ,
    weekday: "short",
  }).format(date);
  return WEEKDAY_MAP[dayStr] ?? 0;
}

export function getHoraArgentina(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ARGENTINA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export function isWithinFranja(
  fechaHora: Date,
  franjas: Pick<IFranjaHoraria, "diaSemana" | "horaInicio" | "horaFin" | "activa">[],
): boolean {
  const activas = franjas.filter((f) => f.activa);
  if (activas.length === 0) {
    return false;
  }

  const dia = getDiaSemanaArgentina(fechaHora);
  const hora = getHoraArgentina(fechaHora);

  return activas.some(
    (franja) =>
      franja.diaSemana === dia &&
      hora >= franja.horaInicio &&
      hora < franja.horaFin,
  );
}
