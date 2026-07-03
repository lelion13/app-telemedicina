import { describe, expect, it } from "vitest";
import {
  getPatientLinkWindow,
  patientLinkWindowLabel,
} from "@/lib/turnos/patient-window";

describe("getPatientLinkWindow", () => {
  const fecha = new Date("2026-07-15T15:00:00.000Z");
  const tokenExpiraEn = new Date(fecha.getTime() + 60 * 60 * 1000);

  it("detecta ventana antes del horario", () => {
    const before = new Date(fecha.getTime() - 30 * 60 * 1000);
    const window = getPatientLinkWindow(fecha, tokenExpiraEn, before);

    expect(window.status).toBe("before_window");
  });

  it("detecta ventana activa", () => {
    const window = getPatientLinkWindow(fecha, tokenExpiraEn, fecha);

    expect(window.status).toBe("in_window");
  });

  it("detecta link expirado", () => {
    const after = new Date(tokenExpiraEn.getTime() + 60 * 1000);
    const window = getPatientLinkWindow(fecha, tokenExpiraEn, after);

    expect(window.status).toBe("expired");
  });

  it("genera mensaje legible", () => {
    const window = getPatientLinkWindow(fecha, tokenExpiraEn, fecha);
    expect(patientLinkWindowLabel(window)).toContain("puede ingresar");
  });
});
