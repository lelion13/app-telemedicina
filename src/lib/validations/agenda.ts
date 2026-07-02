import { z } from "zod";
import { HH_MM_PATTERN } from "@/models/types";

const horaSchema = z.string().regex(HH_MM_PATTERN, "Formato HH:mm");

const agendaBaseSchema = z.object({
  nombre: z.string().trim().optional(),
  descripcion: z.string().trim().optional(),
  fecha: z
    .string()
    .min(1, "Fecha obligatoria")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Fecha inválida",
    }),
  horaInicio: horaSchema,
  horaFin: horaSchema,
  duracionTurnoMinutos: z.number().int().min(5).max(240),
  empresaIds: z.array(z.string()).optional(),
  activa: z.boolean().optional(),
});

export const agendaInputSchema = agendaBaseSchema.refine(
  (data) => data.horaFin > data.horaInicio,
  {
    message: "horaFin debe ser posterior a horaInicio",
    path: ["horaFin"],
  },
);

export const agendaUpdateSchema = agendaBaseSchema.partial().refine(
  (data) => {
    if (data.horaInicio && data.horaFin) {
      return data.horaFin > data.horaInicio;
    }
    return true;
  },
  {
    message: "horaFin debe ser posterior a horaInicio",
    path: ["horaFin"],
  },
);
