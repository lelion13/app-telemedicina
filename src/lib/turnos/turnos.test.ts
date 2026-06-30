import { describe, expect, it } from "vitest";
import { buildTurnoInviteEmail } from "@/lib/mail/turno-invite";
import { isWithinFranja } from "@/lib/turnos/franja";
import { computeTokenWindow } from "@/lib/turnos/patient-token";
import { canAccessApiPath } from "@/lib/admin/metrics";

describe("franja validation", () => {
  it("acepta horario dentro de franja activa", () => {
    const franjas = [
      { diaSemana: 1, horaInicio: "09:00", horaFin: "13:00", activa: true },
    ];
    const fecha = new Date("2026-07-06T10:30:00-03:00");
    expect(isWithinFranja(fecha, franjas)).toBe(true);
  });

  it("rechaza horario fuera de franja", () => {
    const franjas = [
      { diaSemana: 1, horaInicio: "09:00", horaFin: "13:00", activa: true },
    ];
    const fecha = new Date("2026-07-06T15:00:00-03:00");
    expect(isWithinFranja(fecha, franjas)).toBe(false);
  });

  it("ignora franjas inactivas", () => {
    const franjas = [
      { diaSemana: 1, horaInicio: "09:00", horaFin: "13:00", activa: false },
    ];
    const fecha = new Date("2026-07-06T10:00:00-03:00");
    expect(isWithinFranja(fecha, franjas)).toBe(false);
  });
});

describe("patient token window", () => {
  it("calcula ventana antes y después del turno", () => {
    const fecha = new Date("2026-07-06T12:00:00Z");
    process.env.TOKEN_VALID_BEFORE_MIN = "15";
    process.env.TOKEN_VALID_AFTER_MIN = "60";

    const { validFrom, tokenExpiraEn } = computeTokenWindow(fecha);

    expect(validFrom.getTime()).toBe(fecha.getTime() - 15 * 60 * 1000);
    expect(tokenExpiraEn.getTime()).toBe(fecha.getTime() + 60 * 60 * 1000);
  });
});

describe("turno invite mail", () => {
  it("incluye link de consulta y texto en español", () => {
    const mail = buildTurnoInviteEmail({
      pacienteNombre: "Juan",
      fechaHora: new Date("2026-07-06T15:00:00Z"),
      consultaUrl: "https://telemedicina.lionapp.cloud/consulta/abc",
    });

    expect(mail.subject).toContain("teleasistencia");
    expect(mail.text).toContain("/consulta/abc");
    expect(mail.text).toContain("ubicación");
    expect(mail.html).toContain("Juan");
  });
});

describe("empresa API access", () => {
  it("restringe /api/empresa a rol empresa", () => {
    expect(canAccessApiPath("empresa", "/api/empresa/turnos")).toBe(true);
    expect(canAccessApiPath("admin", "/api/empresa/turnos")).toBe(false);
    expect(canAccessApiPath("profesional", "/api/empresa/turnos")).toBe(false);
  });
});
