import { emitTurnoActualizado } from "@/lib/realtime/turno-events";
import type { TurnoActualizadoEvent } from "@/lib/realtime/types";
import type { TurnoEstado } from "@/models/types";

type TurnoLike = {
  _id: { toString(): string };
  empresaId: { toString(): string };
  estado: TurnoEstado;
  profesionalId?: { toString(): string } | string | null;
  updatedAt?: Date;
};

export function buildTurnoActualizadoEvent(turno: TurnoLike): TurnoActualizadoEvent {
  const profesionalId = turno.profesionalId
    ? turno.profesionalId.toString()
    : undefined;

  return {
    type: "turno_actualizado",
    turnoId: turno._id.toString(),
    empresaId: turno.empresaId.toString(),
    estado: turno.estado,
    profesionalId,
    updatedAt: (turno.updatedAt ?? new Date()).toISOString(),
  };
}

export function notifyTurnoActualizado(turno: TurnoLike): void {
  emitTurnoActualizado(buildTurnoActualizadoEvent(turno));
}
