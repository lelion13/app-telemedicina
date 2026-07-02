import { describe, expect, it } from "vitest";
import { buildEvolucionPayload } from "@/lib/turnos/evolucion";
import { closeTurnoSchema, saveEvolucionSchema } from "@/lib/validations/profesional";

describe("buildEvolucionPayload", () => {
  it("guarda texto y referencia GPS", () => {
    const payload = buildEvolucionPayload({
      texto: " Paciente estable ",
      gpsRegistroId: { toString: () => "507f1f77bcf86cd799439099" } as never,
      registradoEn: new Date("2026-07-15T15:00:00.000Z"),
    });

    expect(payload.texto).toBe("Paciente estable");
    expect(payload.gpsRegistroId).toBeTruthy();
    expect(payload.registradoEn).toEqual(new Date("2026-07-15T15:00:00.000Z"));
  });

  it("deja gpsRegistroId en null si no hay registro", () => {
    const payload = buildEvolucionPayload({ texto: "Sin GPS" });
    expect(payload.gpsRegistroId).toBeNull();
  });
});

describe("validaciones evolución profesional", () => {
  it("exige evolución al finalizar", () => {
    const parsed = closeTurnoSchema.safeParse({
      estado: "finalizado",
      evolucion: "   ",
    });

    expect(parsed.success).toBe(false);
  });

  it("permite ausente sin evolución", () => {
    const parsed = closeTurnoSchema.safeParse({ estado: "ausente" });
    expect(parsed.success).toBe(true);
  });

  it("valida guardado intermedio de evolución", () => {
    const parsed = saveEvolucionSchema.safeParse({ evolucion: "Evolución parcial" });
    expect(parsed.success).toBe(true);
  });
});
