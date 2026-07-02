import { describe, expect, it } from "vitest";
import { mapAgendaSlotStatuses } from "@/lib/agenda/slot-status";
import { canAccessApiPath } from "@/lib/admin/metrics";
import {
  administrativoTurnosQuerySchema,
  listAgendasQuerySchema,
} from "@/lib/validations/administrativo";
import { agendaInputSchema } from "@/lib/validations/agenda";

describe("mapAgendaSlotStatuses", () => {
  it("marca slots ocupados según turnos del día", () => {
    const statuses = mapAgendaSlotStatuses("09:00", "10:00", 15, [
      {
        _id: { toString: () => "turno-1" },
        fechaHoraProgramada: new Date("2026-07-15T12:15:00.000Z"),
        estado: "pendiente",
      },
    ]);

    expect(statuses).toEqual([
      { hora: "09:00", ocupado: false },
      { hora: "09:15", ocupado: true, turnoId: "turno-1", estado: "pendiente" },
      { hora: "09:30", ocupado: false },
      { hora: "09:45", ocupado: false },
    ]);
  });
});

describe("validaciones administrativo", () => {
  it("acepta filtros de agendas", () => {
    const parsed = listAgendasQuerySchema.safeParse({
      activa: "true",
      desde: "2026-07-01",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.activa).toBe(true);
    }
  });

  it("acepta filtros de turnos con agendaId", () => {
    const parsed = administrativoTurnosQuerySchema.safeParse({
      agendaId: "66abc123def4567890123456",
      estado: "pendiente",
    });

    expect(parsed.success).toBe(true);
  });

  it("valida payload de creación de agenda", () => {
    const parsed = agendaInputSchema.safeParse({
      fecha: "2026-07-15",
      horaInicio: "09:00",
      horaFin: "12:00",
      duracionTurnoMinutos: 15,
      empresaIds: [],
    });

    expect(parsed.success).toBe(true);
  });

  it("rechaza horario inválido en agenda", () => {
    const parsed = agendaInputSchema.safeParse({
      fecha: "2026-07-15",
      horaInicio: "12:00",
      horaFin: "09:00",
      duracionTurnoMinutos: 15,
    });

    expect(parsed.success).toBe(false);
  });
});

describe("acceso APIs administrativo", () => {
  it("permite solo al rol administrativo", () => {
    expect(canAccessApiPath("administrativo", "/api/administrativo/agendas")).toBe(
      true,
    );
    expect(
      canAccessApiPath("administrativo", "/api/administrativo/agendas/abc/slots"),
    ).toBe(true);
    expect(canAccessApiPath("administrativo", "/api/administrativo/empresas")).toBe(
      true,
    );
    expect(canAccessApiPath("admin", "/api/administrativo/agendas")).toBe(false);
    expect(canAccessApiPath("empresa", "/api/administrativo/turnos")).toBe(false);
    expect(canAccessApiPath("profesional", "/api/administrativo/turnos")).toBe(
      false,
    );
  });
});
