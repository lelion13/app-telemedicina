import { z } from "zod";

export const pacienteTurnoSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre obligatorio"),
  apellido: z.string().trim().min(1, "Apellido obligatorio"),
  telefono: z.string().trim().min(1, "Teléfono obligatorio"),
  email: z.string().trim().email("Email inválido"),
  domicilio: z.string().trim().min(1, "Domicilio obligatorio"),
  descripcion: z.string().trim().optional(),
});

export const createTurnoSchema = z.object({
  paciente: pacienteTurnoSchema,
  fechaHoraProgramada: z
    .string()
    .min(1, "Fecha/hora obligatoria")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Fecha/hora inválida",
    }),
});

export const listTurnosQuerySchema = z.object({
  estado: z
    .enum([
      "pendiente",
      "confirmado",
      "en_curso",
      "finalizado",
      "ausente",
      "cancelado",
    ])
    .optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
});
