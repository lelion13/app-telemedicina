import { z } from "zod";
import { TURNO_ESTADOS } from "@/models/types";

export const listProfesionalTurnosSchema = z.object({
  estado: z.enum(TURNO_ESTADOS).optional(),
  empresaId: z.string().optional(),
  soloHoy: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  desde: z.string().optional(),
  hasta: z.string().optional(),
});

export const closeTurnoSchema = z
  .object({
    estado: z.enum(["finalizado", "ausente"]),
    evolucion: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.evolucion?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          data.estado === "finalizado"
            ? "La evolución es obligatoria al finalizar la consulta"
            : "La evolución es obligatoria al marcar ausente",
        path: ["evolucion"],
      });
    }
  });

export const saveEvolucionSchema = z.object({
  evolucion: z.string().trim().min(1, "La evolución no puede estar vacía"),
});
