import { describe, expect, it } from "vitest";
import {
  calculateAusentismoRate,
  canAccessApiPath,
} from "@/lib/admin/metrics";

describe("admin metrics", () => {
  it("calcula tasa de ausentismo", () => {
    expect(calculateAusentismoRate(8, 2)).toBe(20);
    expect(calculateAusentismoRate(0, 0)).toBe(0);
    expect(calculateAusentismoRate(3, 0)).toBe(0);
    expect(calculateAusentismoRate(1, 1)).toBe(50);
  });

  it("restringe /api/admin solo a admin", () => {
    expect(canAccessApiPath("admin", "/api/admin/metrics")).toBe(true);
    expect(canAccessApiPath("empresa", "/api/admin/metrics")).toBe(false);
    expect(canAccessApiPath("profesional", "/api/admin/empresas")).toBe(false);
    expect(canAccessApiPath("empresa", "/api/turnos")).toBe(true);
    expect(canAccessApiPath("empresa", "/api/empresa/turnos")).toBe(true);
    expect(canAccessApiPath("admin", "/api/empresa/turnos")).toBe(false);
    expect(canAccessApiPath("profesional", "/api/profesional/turnos")).toBe(
      true,
    );
    expect(canAccessApiPath("empresa", "/api/profesional/turnos")).toBe(false);
  });
});
