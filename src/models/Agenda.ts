import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { HH_MM_PATTERN } from "./types";

const agendaSchema = new Schema(
  {
    nombre: { type: String, trim: true },
    descripcion: { type: String, trim: true },
    fecha: { type: Date, required: true },
    horaInicio: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => HH_MM_PATTERN.test(v),
        message: "horaInicio debe tener formato HH:mm",
      },
    },
    horaFin: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => HH_MM_PATTERN.test(v),
        message: "horaFin debe tener formato HH:mm",
      },
    },
    duracionTurnoMinutos: {
      type: Number,
      required: true,
      min: 5,
      max: 240,
    },
    empresaIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Empresa" }],
      default: [],
    },
    creadoPorId: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true },
);

agendaSchema.index({ fecha: 1, activa: 1 });
agendaSchema.index({ activa: 1, fecha: -1 });
agendaSchema.index({ creadoPorId: 1 });

agendaSchema.pre("validate", function validateHoras() {
  if (this.horaInicio && this.horaFin && this.horaFin <= this.horaInicio) {
    this.invalidate("horaFin", "horaFin debe ser posterior a horaInicio");
  }
});

export type IAgenda = InferSchemaType<typeof agendaSchema>;

export const Agenda: Model<IAgenda> =
  models.Agenda ?? model<IAgenda>("Agenda", agendaSchema);
