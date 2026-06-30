import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { DIAS_SEMANA, HH_MM_PATTERN } from "./types";

const franjaHorariaSchema = new Schema(
  {
    diaSemana: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
      enum: DIAS_SEMANA,
    },
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
    activa: { type: Boolean, default: true },
  },
  { timestamps: true },
);

franjaHorariaSchema.index({ diaSemana: 1, activa: 1 });
franjaHorariaSchema.index({ activa: 1 });

franjaHorariaSchema.pre("validate", function validateHoras() {
  if (this.horaInicio && this.horaFin && this.horaFin <= this.horaInicio) {
    this.invalidate("horaFin", "horaFin debe ser posterior a horaInicio");
  }
});

export type IFranjaHoraria = InferSchemaType<typeof franjaHorariaSchema>;

export const FranjaHoraria: Model<IFranjaHoraria> =
  models.FranjaHoraria ??
  model<IFranjaHoraria>("FranjaHoraria", franjaHorariaSchema);
