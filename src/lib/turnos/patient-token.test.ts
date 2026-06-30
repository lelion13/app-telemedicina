import { describe, expect, it, beforeAll } from "vitest";
import {
  computeTokenWindow,
  createPatientAccessToken,
  verifyPatientAccessToken,
} from "@/lib/turnos/patient-token";

beforeAll(() => {
  process.env.PATIENT_TOKEN_SECRET = "test-patient-secret-min-32-chars-long";
});

describe("patient access token", () => {
  it("crea y verifica un token reutilizable dentro de la ventana", async () => {
    const fecha = new Date("2026-07-06T15:00:00Z");
    const { tokenExpiraEn } = computeTokenWindow(fecha);
    const turnoId = "507f1f77bcf86cd799439011";

    const token = await createPatientAccessToken(turnoId, tokenExpiraEn);
    const verified = await verifyPatientAccessToken(token);

    expect(verified.turnoId).toBe(turnoId);

    const reused = await verifyPatientAccessToken(token);
    expect(reused.turnoId).toBe(turnoId);
  });
});
