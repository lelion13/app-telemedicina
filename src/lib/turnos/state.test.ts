import { describe, expect, it } from "vitest";
import {
  canCloseConsulta,
  canStartConsulta,
  canTakeTurno,
  nextEstadoAfterStart,
  nextEstadoAfterTake,
} from "@/lib/turnos/state";
import { canAccessApiPath } from "@/lib/admin/metrics";

describe("turno state transitions", () => {
  const profId = "prof-123";

  it("permite tomar turno pendiente sin profesional", () => {
    expect(canTakeTurno({ estado: "pendiente", profesionalId: null })).toBe(true);
    expect(canTakeTurno({ estado: "confirmado", profesionalId: null })).toBe(true);
    expect(canTakeTurno({ estado: "pendiente", profesionalId: profId })).toBe(
      false,
    );
    expect(canTakeTurno({ estado: "en_curso", profesionalId: null })).toBe(false);
  });

  it("permite iniciar consulta si está asignado al profesional", () => {
    expect(
      canStartConsulta({ estado: "confirmado", profesionalId: profId }, profId),
    ).toBe(true);
    expect(
      canStartConsulta(
        {
          estado: "confirmado",
          profesionalId: { _id: { toString: () => profId }, nombre: "Ana" },
        },
        profId,
      ),
    ).toBe(true);
    expect(
      canStartConsulta({ estado: "confirmado", profesionalId: "otro" }, profId),
    ).toBe(false);
  });

  it("permite cerrar solo consultas en curso asignadas", () => {
    expect(
      canCloseConsulta({ estado: "en_curso", profesionalId: profId }, profId),
    ).toBe(true);
    expect(
      canCloseConsulta({ estado: "confirmado", profesionalId: profId }, profId),
    ).toBe(false);
  });

  it("define estados posteriores a tomar e iniciar", () => {
    expect(nextEstadoAfterTake()).toBe("confirmado");
    expect(nextEstadoAfterStart()).toBe("en_curso");
  });
});

describe("profesional API access", () => {
  it("restringe /api/profesional a rol profesional", () => {
    expect(canAccessApiPath("profesional", "/api/profesional/turnos")).toBe(
      true,
    );
    expect(canAccessApiPath("empresa", "/api/profesional/turnos")).toBe(false);
    expect(canAccessApiPath("admin", "/api/profesional/turnos")).toBe(false);
  });
});
