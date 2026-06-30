import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const contactoSchema = new Schema(
  {
    email: { type: String, trim: true, lowercase: true },
    telefono: { type: String, trim: true },
    direccion: { type: String, trim: true },
  },
  { _id: false },
);

const empresaSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    cuit: { type: String, trim: true },
    contacto: { type: contactoSchema, default: {} },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true },
);

empresaSchema.index({ activa: 1 });

export type IEmpresa = InferSchemaType<typeof empresaSchema>;

export const Empresa: Model<IEmpresa> =
  models.Empresa ?? model<IEmpresa>("Empresa", empresaSchema);
