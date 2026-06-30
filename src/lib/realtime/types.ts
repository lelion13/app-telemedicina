import type { TurnoEstado } from "@/models/types";

export type TurnoActualizadoEvent = {
  type: "turno_actualizado";
  turnoId: string;
  empresaId: string;
  estado: TurnoEstado;
  profesionalId?: string;
  updatedAt: string;
};

export type TurnoActualizadoClientEvent = Omit<
  TurnoActualizadoEvent,
  "empresaId"
>;

export function toClientEvent(
  event: TurnoActualizadoEvent,
): TurnoActualizadoClientEvent {
  return {
    type: event.type,
    turnoId: event.turnoId,
    estado: event.estado,
    profesionalId: event.profesionalId,
    updatedAt: event.updatedAt,
  };
}

export function shouldDeliverToEmpresa(
  eventEmpresaId: string,
  subscriberEmpresaId: string,
): boolean {
  return eventEmpresaId === subscriberEmpresaId;
}
