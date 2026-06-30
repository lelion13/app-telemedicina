import { z } from "zod";

export const livekitTokenSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("paciente"),
    patientToken: z.string().min(1),
  }),
  z.object({
    role: z.literal("profesional"),
    turnoId: z.string().min(1),
  }),
]);

export type LivekitTokenInput = z.infer<typeof livekitTokenSchema>;
