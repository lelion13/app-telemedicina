import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const pacienteSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    domicilio: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: "Empresa",
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

pacienteSchema.index({ empresaId: 1, email: 1 });
pacienteSchema.index({ empresaId: 1, telefono: 1 });
pacienteSchema.index({ empresaId: 1, createdAt: -1 });

export type IPaciente = InferSchemaType<typeof pacienteSchema>;

export const Paciente: Model<IPaciente> =
  models.Paciente ?? model<IPaciente>("Paciente", pacienteSchema);
