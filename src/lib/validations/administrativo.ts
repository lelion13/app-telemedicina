import { z } from "zod";
import { listTurnosQuerySchema } from "@/lib/validations/turnos";

export const listAgendasQuerySchema = z.object({
  activa: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  desde: z.string().optional(),
  hasta: z.string().optional(),
});

export const administrativoTurnosQuerySchema = listTurnosQuerySchema.extend({
  agendaId: z.string().optional(),
});
