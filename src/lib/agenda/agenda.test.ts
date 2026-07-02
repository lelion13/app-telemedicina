import { describe, expect, it } from "vitest";
import { canEmpresaAccessAgenda } from "@/lib/agenda/access";
import {
  generateSlots,
  getAgendaDayKey,
  matchesAgendaSlot,
  parseAgendaDayKey,
} from "@/lib/agenda/slots";

describe("agenda slots", () => {
  it("genera slots con duración fija", () => {
    expect(generateSlots("09:00", "10:00", 15)).toEqual([
      "09:00",
      "09:15",
      "09:30",
      "09:45",
    ]);
  });

  it("valida horario dentro de agenda del día", () => {
    const fecha = parseAgendaDayKey("2026-07-15");
    const fechaHora = new Date("2026-07-15T12:30:00.000Z");

    expect(
      matchesAgendaSlot(fechaHora, {
        fecha,
        horaInicio: "09:00",
        horaFin: "13:00",
        duracionTurnoMinutos: 30,
      }),
    ).toBe(true);
  });

  it("rechaza horario fuera de slots", () => {
    const fecha = parseAgendaDayKey("2026-07-15");
    const fechaHora = new Date("2026-07-15T18:00:00.000Z");

    expect(
      matchesAgendaSlot(fechaHora, {
        fecha,
        horaInicio: "09:00",
        horaFin: "13:00",
        duracionTurnoMinutos: 30,
      }),
    ).toBe(false);
  });

  it("normaliza clave de día en Argentina", () => {
    const day = getAgendaDayKey(new Date("2026-07-15T03:00:00.000Z"));
    expect(day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("agenda access", () => {
  it("permite cualquier empresa cuando empresaIds está vacío", () => {
    expect(canEmpresaAccessAgenda("empresa-1", { empresaIds: [] })).toBe(true);
    expect(canEmpresaAccessAgenda("empresa-1", { empresaIds: null })).toBe(true);
  });

  it("restringe a empresas listadas", () => {
    const empresaIds = [{ toString: () => "empresa-1" }] as never;
    expect(canEmpresaAccessAgenda("empresa-1", { empresaIds })).toBe(true);
    expect(canEmpresaAccessAgenda("empresa-2", { empresaIds })).toBe(false);
  });
});
