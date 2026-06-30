import { z } from "zod";
import { DIAS_SEMANA, HH_MM_PATTERN, ROLES } from "@/models/types";

export const empresaInputSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  cuit: z.string().trim().optional(),
  contacto: z
    .object({
      email: z.string().email().optional().or(z.literal("")),
      telefono: z.string().trim().optional(),
      direccion: z.string().trim().optional(),
    })
    .optional(),
  activa: z.boolean().optional(),
});

const usuarioBaseSchema = z.object({
  nombre: z.string().trim().min(1),
  apellido: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(12).optional(),
  rol: z.enum(ROLES),
  empresaId: z.string().optional(),
  activo: z.boolean().optional(),
});

export const usuarioInputSchema = usuarioBaseSchema.superRefine((data, ctx) => {
  if (data.rol === "empresa" && !data.empresaId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "empresaId es obligatorio para rol empresa",
      path: ["empresaId"],
    });
  }
});

export const usuarioCreateSchema = usuarioBaseSchema
  .extend({
    password: z
      .string()
      .min(12, "La contraseña debe tener al menos 12 caracteres"),
  })
  .superRefine((data, ctx) => {
    if (data.rol === "empresa" && !data.empresaId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "empresaId es obligatorio para rol empresa",
        path: ["empresaId"],
      });
    }
  });

const franjaBaseSchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  horaInicio: z.string().regex(HH_MM_PATTERN, "Formato HH:mm"),
  horaFin: z.string().regex(HH_MM_PATTERN, "Formato HH:mm"),
  activa: z.boolean().optional(),
});

export const franjaInputSchema = franjaBaseSchema.refine(
  (data) => data.horaFin > data.horaInicio,
  {
    message: "horaFin debe ser posterior a horaInicio",
    path: ["horaFin"],
  },
);

export const franjaUpdateSchema = franjaBaseSchema.partial().refine(
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

export const auditoriaQuerySchema = z.object({
  tipo: z.enum(["gps", "logs"]).default("gps"),
  turnoId: z.string().optional(),
  empresaId: z.string().optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
});

export const metricsQuerySchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
});

export const diaSemanaOptions = DIAS_SEMANA.map((value) => value);
