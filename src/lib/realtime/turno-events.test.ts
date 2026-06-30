import { describe, expect, it, afterEach } from "vitest";
import { canAccessApiPath } from "@/lib/admin/metrics";
import {
  emitTurnoActualizado,
  resetTurnoEventBus,
  subscribeTurnoEvents,
} from "@/lib/realtime/turno-events";
import { buildTurnoActualizadoEvent } from "@/lib/realtime/notify";
import {
  shouldDeliverToEmpresa,
  toClientEvent,
} from "@/lib/realtime/types";

afterEach(() => {
  resetTurnoEventBus();
});

describe("turno realtime events", () => {
  it("entrega eventos solo al tenant suscripto", () => {
    const empresaA: string[] = [];
    const empresaB: string[] = [];

    const unsubA = subscribeTurnoEvents("empresa-a", (event) => {
      empresaA.push(event.turnoId);
    });
    const unsubB = subscribeTurnoEvents("empresa-b", (event) => {
      empresaB.push(event.turnoId);
    });

    emitTurnoActualizado({
      type: "turno_actualizado",
      turnoId: "turno-1",
      empresaId: "empresa-a",
      estado: "finalizado",
      updatedAt: "2026-07-06T12:00:00.000Z",
    });

    expect(empresaA).toEqual(["turno-1"]);
    expect(empresaB).toEqual([]);
    expect(shouldDeliverToEmpresa("empresa-a", "empresa-a")).toBe(true);
    expect(shouldDeliverToEmpresa("empresa-a", "empresa-b")).toBe(false);

    unsubA();
    unsubB();
  });

  it("expone payload mínimo al cliente sin empresaId", () => {
    const event = buildTurnoActualizadoEvent({
      _id: { toString: () => "turno-1" },
      empresaId: { toString: () => "empresa-a" },
      estado: "en_curso",
      profesionalId: { toString: () => "prof-1" },
      updatedAt: new Date("2026-07-06T12:00:00.000Z"),
    });

    expect(toClientEvent(event)).toEqual({
      type: "turno_actualizado",
      turnoId: "turno-1",
      estado: "en_curso",
      profesionalId: "prof-1",
      updatedAt: "2026-07-06T12:00:00.000Z",
    });
    expect(toClientEvent(event)).not.toHaveProperty("empresaId");
  });
});

describe("events API access", () => {
  it("restringe /api/events/turnos a rol empresa", () => {
    expect(canAccessApiPath("empresa", "/api/events/turnos")).toBe(true);
    expect(canAccessApiPath("admin", "/api/events/turnos")).toBe(false);
    expect(canAccessApiPath("profesional", "/api/events/turnos")).toBe(false);
  });
});
