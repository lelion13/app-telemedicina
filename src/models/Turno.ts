import { randomUUID } from "crypto";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { TURNO_ESTADOS } from "./types";

const turnoSchema = new Schema(
  {
    pacienteId: {
      type: Schema.Types.ObjectId,
      ref: "Paciente",
      required: true,
    },
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: "Empresa",
      required: true,
    },
    profesionalId: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      default: null,
    },
    fechaHoraProgramada: { type: Date, required: true },
    estado: {
      type: String,
      required: true,
      enum: TURNO_ESTADOS,
      default: "pendiente",
    },
    accessToken: { type: String, required: true, unique: true },
    tokenExpiraEn: { type: Date, required: true },
    salaVideoId: {
      type: String,
      required: true,
      default: () => `turno-${randomUUID()}`,
    },
    notasProfesional: { type: String, trim: true },
  },
  { timestamps: true },
);

turnoSchema.index({ empresaId: 1, estado: 1 });
turnoSchema.index({ fechaHoraProgramada: 1 });
turnoSchema.index({ profesionalId: 1, estado: 1 });
turnoSchema.index({ empresaId: 1, fechaHoraProgramada: -1 });

export type ITurno = InferSchemaType<typeof turnoSchema>;

export const Turno: Model<ITurno> =
  models.Turno ?? model<ITurno>("Turno", turnoSchema);
