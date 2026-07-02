export const ROLES = ["admin", "administrativo", "empresa", "profesional"] as const;
export type Rol = (typeof ROLES)[number];

export const TURNO_ESTADOS = [
  "pendiente",
  "confirmado",
  "en_curso",
  "finalizado",
  "ausente",
  "cancelado",
] as const;
export type TurnoEstado = (typeof TURNO_ESTADOS)[number];

export const GPS_ORIGENES = ["navegador", "ip_fallback", "no_verificado"] as const;
export type GpsOrigen = (typeof GPS_ORIGENES)[number];

export const LOG_EVENTOS = [
  "paciente_ingreso",
  "profesional_ingreso",
  "llamada_iniciada",
  "llamada_finalizada",
  "gps_capturado",
  "gps_rechazado",
] as const;
export type LogEvento = (typeof LOG_EVENTOS)[number];

export const DIAS_SEMANA = [0, 1, 2, 3, 4, 5, 6] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

/** 0 = domingo, 6 = sábado */
export const DIA_SEMANA_LABELS: Record<DiaSemana, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

export const HH_MM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
