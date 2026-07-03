import type { TurnoEstado } from "@/models/types";
import { extractDocumentId } from "@/lib/mongoose/ref-id";

type TurnoRef = {
  profesionalId?: { _id?: { toString(): string }; toString(): string } | string | null;
  estado: TurnoEstado;
};

export function canTakeTurno(turno: TurnoRef): boolean {
  if (extractDocumentId(turno.profesionalId)) {
    return false;
  }
  return turno.estado === "pendiente" || turno.estado === "confirmado";
}

export function isAssignedToProfesional(
  turno: TurnoRef,
  profesionalId: string,
): boolean {
  const turnoProfesionalId = extractDocumentId(turno.profesionalId);
  if (!turnoProfesionalId) {
    return false;
  }
  return turnoProfesionalId === profesionalId;
}

export function canStartConsulta(turno: TurnoRef, profesionalId: string): boolean {
  return (
    isAssignedToProfesional(turno, profesionalId) &&
    (turno.estado === "pendiente" || turno.estado === "confirmado")
  );
}

export function canCloseConsulta(turno: TurnoRef, profesionalId: string): boolean {
  return isAssignedToProfesional(turno, profesionalId) && turno.estado === "en_curso";
}

export function nextEstadoAfterTake(): TurnoEstado {
  return "confirmado";
}

export function nextEstadoAfterStart(): TurnoEstado {
  return "en_curso";
}
