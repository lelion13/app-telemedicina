import { describe, expect, it } from "vitest";
import { canEmpresaAccessAgenda } from "@/lib/agenda/access";
import { buildSlotDateTime, getHoraSlot } from "@/lib/agenda/slots";
import { mapAgendaSlotStatuses } from "@/lib/agenda/slot-status";
import { buildEmpresaAgendaFilter } from "@/lib/empresa/agenda-service";
import { canAccessApiPath } from "@/lib/admin/metrics";
import { createTurnoSchema } from "@/lib/validations/turnos";

describe("empresa agendas", () => {
  it("incluye agendas públicas y restringidas en el filtro", () => {
    const filter = buildEmpresaAgendaFilter("507f1f77bcf86cd799439011");

    expect(filter.activa).toBe(true);
    expect(filter.$or).toHaveLength(2);
    expect(filter.fecha.$gte).toBeInstanceOf(Date);
  });

  it("permite acceso a agenda pública", () => {
    expect(canEmpresaAccessAgenda("empresa-a", { empresaIds: [] })).toBe(true);
  });

  it("bloquea agenda de otra empresa", () => {
    const empresaIds = [{ toString: () => "empresa-b" }] as never;
    expect(canEmpresaAccessAgenda("empresa-a", { empresaIds })).toBe(false);
  });

  it("construye fecha/hora del slot en Argentina", () => {
    const fechaHora = buildSlotDateTime("2026-07-15T12:00:00.000Z", "09:30");
    expect(getHoraSlot(fechaHora)).toBe("09:30");
  });

  it("detecta slot ocupado", () => {
    const statuses = mapAgendaSlotStatuses("09:00", "10:00", 15, [
      {
        _id: { toString: () => "turno-1" },
        fechaHoraProgramada: buildSlotDateTime("2026-07-15T12:00:00.000Z", "09:15"),
        estado: "pendiente",
      },
    ]);

    expect(statuses.find((slot) => slot.hora === "09:15")?.ocupado).toBe(true);
    expect(statuses.find((slot) => slot.hora === "09:30")?.ocupado).toBe(false);
  });

  it("exige agendaId al crear turno", () => {
    const parsed = createTurnoSchema.safeParse({
      agendaId: "",
      fechaHoraProgramada: new Date().toISOString(),
      paciente: {
        nombre: "Ana",
        apellido: "López",
        telefono: "111",
        email: "ana@test.com",
        domicilio: "Calle 1",
      },
    });

    expect(parsed.success).toBe(false);
  });
});

describe("empresa API access", () => {
  it("restringe /api/empresa/agendas a rol empresa", () => {
    expect(canAccessApiPath("empresa", "/api/empresa/agendas")).toBe(true);
    expect(canAccessApiPath("empresa", "/api/empresa/agendas/abc/slots")).toBe(
      true,
    );
    expect(canAccessApiPath("administrativo", "/api/empresa/agendas")).toBe(false);
    expect(canAccessApiPath("profesional", "/api/empresa/agendas")).toBe(false);
  });
});
