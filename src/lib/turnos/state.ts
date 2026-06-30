import type { TurnoEstado } from "@/models/types";

type TurnoRef = {
  profesionalId?: { toString(): string } | string | null;
  estado: TurnoEstado;
};

export function canTakeTurno(turno: TurnoRef): boolean {
  if (turno.profesionalId) {
    return false;
  }
  return turno.estado === "pendiente" || turno.estado === "confirmado";
}

export function isAssignedToProfesional(
  turno: TurnoRef,
  profesionalId: string,
): boolean {
  if (!turno.profesionalId) {
    return false;
  }
  return turno.profesionalId.toString() === profesionalId;
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
