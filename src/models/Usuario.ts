import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ROLES, type Rol } from "./types";

const usuarioSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true, select: false },
    rol: { type: String, required: true, enum: ROLES },
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: "Empresa",
      required(this: { rol: Rol }) {
        return this.rol === "empresa";
      },
    },
    activo: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

usuarioSchema.index({ rol: 1, activo: 1 });
usuarioSchema.index({ empresaId: 1 });

export type IUsuario = InferSchemaType<typeof usuarioSchema>;

export const Usuario: Model<IUsuario> =
  models.Usuario ?? model<IUsuario>("Usuario", usuarioSchema);
