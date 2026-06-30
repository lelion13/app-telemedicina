import { describe, expect, it } from "vitest";
import {
  canAccessPath,
  getDashboardForRole,
  isPublicPath,
} from "@/lib/authz";
import { canAccessApiPath } from "@/lib/admin/metrics";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password helpers", () => {
  it("hashea y verifica contraseñas correctamente", async () => {
    const hash = await hashPassword("contraseña-segura-123");
    expect(hash).not.toContain("contraseña-segura-123");
    await expect(verifyPassword("contraseña-segura-123", hash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword("otra-clave", hash)).resolves.toBe(false);
  });
});

describe("authz", () => {
  it("redirige cada rol a su dashboard", () => {
    expect(getDashboardForRole("admin")).toBe("/admin");
    expect(getDashboardForRole("empresa")).toBe("/empresa");
    expect(getDashboardForRole("profesional")).toBe("/profesional");
  });

  it("permite acceso solo a rutas del rol correspondiente", () => {
    expect(canAccessPath("empresa", "/empresa/turnos")).toBe(true);
    expect(canAccessPath("empresa", "/admin")).toBe(false);
    expect(canAccessPath("admin", "/admin/franjas")).toBe(true);
    expect(canAccessPath("profesional", "/empresa")).toBe(false);
  });

  it("expone rutas públicas sin autenticación", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/consulta/abc123")).toBe(true);
    expect(isPublicPath("/api/auth/session")).toBe(true);
    expect(isPublicPath("/api/auth/me")).toBe(false);
    expect(isPublicPath("/admin")).toBe(false);
  });

  it("bloquea APIs admin para roles no admin", () => {
    expect(canAccessApiPath("empresa", "/api/admin/franjas")).toBe(false);
  });
});
