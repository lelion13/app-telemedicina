import { describe, expect, it } from "vitest";
import { resolveGpsOrigen } from "@/lib/gps/service";

describe("resolveGpsOrigen", () => {
  const ipLookup = { lat: -34.6, lng: -58.4 };

  it("registra navegador cuando la precisión es aceptable", () => {
    const result = resolveGpsOrigen({
      permisoDenegado: false,
      lat: -34.61,
      lng: -58.38,
      accuracy: 50,
      threshold: 1000,
      ipLookup,
    });

    expect(result).toEqual({
      origen: "navegador",
      lat: -34.61,
      lng: -58.38,
      accuracy: 50,
    });
  });

  it("usa ip_fallback cuando la precisión supera el umbral", () => {
    const result = resolveGpsOrigen({
      permisoDenegado: false,
      lat: -34.61,
      lng: -58.38,
      accuracy: 2500,
      threshold: 1000,
      ipLookup,
    });

    expect(result.origen).toBe("ip_fallback");
    expect(result.lat).toBe(-34.6);
  });

  it("registra no_verificado si el permiso fue denegado sin fallback", () => {
    const result = resolveGpsOrigen({
      permisoDenegado: true,
      threshold: 1000,
      ipLookup: null,
    });

    expect(result).toEqual({ origen: "no_verificado" });
  });

  it("usa ip_fallback si el permiso fue denegado pero hay geoip", () => {
    const result = resolveGpsOrigen({
      permisoDenegado: true,
      threshold: 1000,
      ipLookup,
    });

    expect(result.origen).toBe("ip_fallback");
  });
});
