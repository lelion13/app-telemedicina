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

export const closeTurnoSchema = z.object({
  estado: z.enum(["finalizado", "ausente"]),
  notasProfesional: z.string().trim().optional(),
});
