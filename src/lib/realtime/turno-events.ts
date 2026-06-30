import { EventEmitter } from "events";
import type { TurnoActualizadoEvent } from "@/lib/realtime/types";

const globalForEvents = globalThis as typeof globalThis & {
  turnoEventBus?: EventEmitter;
};

function getBus(): EventEmitter {
  if (!globalForEvents.turnoEventBus) {
    globalForEvents.turnoEventBus = new EventEmitter();
    globalForEvents.turnoEventBus.setMaxListeners(200);
  }
  return globalForEvents.turnoEventBus;
}

export function channelForEmpresa(empresaId: string): string {
  return `empresa:${empresaId}`;
}

export function emitTurnoActualizado(event: TurnoActualizadoEvent): void {
  getBus().emit(channelForEmpresa(event.empresaId), event);
}

export function subscribeTurnoEvents(
  empresaId: string,
  handler: (event: TurnoActualizadoEvent) => void,
): () => void {
  const channel = channelForEmpresa(empresaId);
  getBus().on(channel, handler);
  return () => {
    getBus().off(channel, handler);
  };
}

/** Expuesto para tests. */
export function resetTurnoEventBus(): void {
  globalForEvents.turnoEventBus = undefined;
}
