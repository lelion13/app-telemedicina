import { describe, expect, it, afterEach } from "vitest";
import { SignJWT } from "jose";
import { canAccessApiPath } from "@/lib/admin/metrics";
import {
  assertEmpresaResource,
  buildEmpresaScopedQuery,
} from "@/lib/security/idor";
import { getAuditRetentionCutoffDate, getAuditRetentionMonths } from "@/lib/security/retention";
import {
  checkRateLimit,
  RATE_LIMITS,
  resetRateLimitStore,
} from "@/lib/security/rate-limit";
import { redactForLog } from "@/lib/security/safe-log";
import { buildContentSecurityPolicy } from "@/lib/security/headers";
import { verifyPatientAccessToken } from "@/lib/turnos/patient-token";

afterEach(() => {
  resetRateLimitStore();
});

describe("rate limiting", () => {
  it("bloquea después del máximo de intentos", () => {
    const key = "test-ip";
    const config = { windowMs: 60_000, maxRequests: 3 };

    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);

    const blocked = checkRateLimit(key, config);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("define límites para login y consulta pública", () => {
    expect(RATE_LIMITS.login.maxRequests).toBeGreaterThan(0);
    expect(RATE_LIMITS.consulta.maxRequests).toBeGreaterThan(0);
  });
});

describe("safe logging", () => {
  it("redacta passwords, tokens y secrets en metadata", () => {
    const redacted = redactForLog({
      email: "user@test.com",
      password: "plain-text",
      accessToken: "eyJhbGciOiJIUzI1NiJ9.eyJhIjoxfQ.sig",
      nested: { apiSecret: "super-secret" },
    }) as Record<string, unknown>;

    expect(redacted.email).toBe("user@test.com");
    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.accessToken).toBe("[REDACTED]");
    expect((redacted.nested as Record<string, string>).apiSecret).toBe(
      "[REDACTED]",
    );
  });
});

describe("retención de auditoría", () => {
  it("usa 24 meses por defecto", () => {
    delete process.env.AUDIT_RETENTION_MONTHS;
    expect(getAuditRetentionMonths()).toBe(24);

    const cutoff = getAuditRetentionCutoffDate(new Date("2026-06-29T00:00:00Z"));
    expect(cutoff.getUTCFullYear()).toBe(2024);
  });
});

describe("headers de seguridad", () => {
  it("incluye CSP sin frame-ancestors permisivos", () => {
    const csp = buildContentSecurityPolicy();
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("default-src 'self'");
  });
});

describe("IDOR y control de acceso", () => {
  it("rechaza recursos de otra empresa", () => {
    expect(assertEmpresaResource("empresa-a", "empresa-b")).toBe(false);
    expect(assertEmpresaResource("empresa-a", "empresa-a")).toBe(true);
  });

  it("fuerza empresaId en queries de listado", () => {
    const query = buildEmpresaScopedQuery("empresa-1", { estado: "pendiente" });
    expect(query).toEqual({ estado: "pendiente", empresaId: "empresa-1" });
  });

  it("bloquea acceso cruzado entre roles en APIs", () => {
    expect(canAccessApiPath("empresa", "/api/admin/metrics")).toBe(false);
    expect(canAccessApiPath("empresa", "/api/profesional/turnos")).toBe(false);
    expect(canAccessApiPath("profesional", "/api/empresa/turnos")).toBe(false);
    expect(canAccessApiPath("admin", "/api/empresa/turnos")).toBe(false);
  });
});

describe("token paciente manipulado", () => {
  it("rechaza JWT firmado con secreto incorrecto", async () => {
    process.env.PATIENT_TOKEN_SECRET = "secreto-valido-de-al-menos-32-chars";

    const forged = await new SignJWT({ turnoId: "507f1f77bcf86cd799439011" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(new Date("2099-01-01T00:00:00Z").getTime() / 1000))
      .sign(new TextEncoder().encode("secreto-atacante-distinto"));

    await expect(verifyPatientAccessToken(forged)).rejects.toMatchObject({
      code: "expired",
    });
  });
});
