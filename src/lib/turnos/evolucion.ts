import type { Types } from "mongoose";

export type EvolucionInput = {
  texto: string;
  gpsRegistroId?: Types.ObjectId | null;
  registradoEn?: Date;
};

export function buildEvolucionPayload(input: EvolucionInput) {
  const texto = input.texto.trim();

  return {
    texto,
    registradoEn: input.registradoEn ?? new Date(),
    gpsRegistroId: input.gpsRegistroId ?? null,
  };
}
