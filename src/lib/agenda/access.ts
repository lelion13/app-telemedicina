import type { Types } from "mongoose";

type AgendaEmpresaScope = {
  empresaIds?: Types.ObjectId[] | null;
};

export function canEmpresaAccessAgenda(
  empresaId: string,
  agenda: AgendaEmpresaScope,
): boolean {
  const ids = agenda.empresaIds ?? [];

  if (ids.length === 0) {
    return true;
  }

  return ids.some((id) => id.toString() === empresaId);
}
