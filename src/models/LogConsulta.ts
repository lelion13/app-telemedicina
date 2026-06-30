import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { LOG_EVENTOS } from "./types";

const logConsultaSchema = new Schema(
  {
    turnoId: {
      type: Schema.Types.ObjectId,
      ref: "Turno",
      required: true,
    },
    evento: {
      type: String,
      required: true,
      enum: LOG_EVENTOS,
    },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: false },
);

logConsultaSchema.index({ turnoId: 1, timestamp: -1 });
logConsultaSchema.index({ evento: 1, timestamp: -1 });

export type ILogConsulta = InferSchemaType<typeof logConsultaSchema>;

export const LogConsulta: Model<ILogConsulta> =
  models.LogConsulta ??
  model<ILogConsulta>("LogConsulta", logConsultaSchema);
