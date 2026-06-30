import connectDB from "@/lib/db";
import { logConsultaEvent } from "@/lib/consulta/audit";
import { RegistroGPS } from "@/models";
import type { GpsOrigen } from "@/models/types";

export function getGpsAccuracyThreshold(): number {
  return Number(process.env.GPS_ACCURACY_THRESHOLD_M ?? 1000);
}

export function lookupIpCoordinates(
  ip: string | undefined,
): { lat: number; lng: number } | null {
  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return null;
  }

  // Carga diferida: geoip-lite lee archivos .dat en runtime (no compatible con bundle estático).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const geoip = require("geoip-lite") as typeof import("geoip-lite");
  const geo = geoip.lookup(ip);
  if (!geo?.ll) {
    return null;
  }

  return { lat: geo.ll[0], lng: geo.ll[1] };
}

export function resolveGpsOrigen(input: {
  permisoDenegado: boolean;
  lat?: number;
  lng?: number;
  accuracy?: number;
  threshold: number;
  ipLookup: { lat: number; lng: number } | null;
}): {
  origen: GpsOrigen;
  lat?: number;
  lng?: number;
  accuracy?: number;
} {
  if (input.permisoDenegado) {
    if (input.ipLookup) {
      return {
        origen: "ip_fallback",
        lat: input.ipLookup.lat,
        lng: input.ipLookup.lng,
      };
    }
    return { origen: "no_verificado" };
  }

  if (input.lat != null && input.lng != null) {
    if (input.accuracy != null && input.accuracy <= input.threshold) {
      return {
        origen: "navegador",
        lat: input.lat,
        lng: input.lng,
        accuracy: input.accuracy,
      };
    }
  }

  if (input.ipLookup) {
    return {
      origen: "ip_fallback",
      lat: input.ipLookup.lat,
      lng: input.ipLookup.lng,
    };
  }

  return { origen: "no_verificado" };
}

export async function registerGpsForTurno(params: {
  turnoId: string;
  permisoDenegado: boolean;
  lat?: number;
  lng?: number;
  accuracy?: number;
  ip?: string;
  userAgent?: string;
}) {
  await connectDB();

  const threshold = getGpsAccuracyThreshold();
  const ipLookup = lookupIpCoordinates(params.ip);
  const resolved = resolveGpsOrigen({
    permisoDenegado: params.permisoDenegado,
    lat: params.lat,
    lng: params.lng,
    accuracy: params.accuracy,
    threshold,
    ipLookup,
  });

  const registro = await RegistroGPS.create({
    turnoId: params.turnoId,
    lat: resolved.lat,
    lng: resolved.lng,
    accuracy: resolved.accuracy,
    origen: resolved.origen,
    userAgent: params.userAgent,
    ip: params.ip,
  });

  await logConsultaEvent(
    params.turnoId,
    resolved.origen === "no_verificado" ? "gps_rechazado" : "gps_capturado",
    {
      origen: resolved.origen,
      accuracy: resolved.accuracy,
      ip: params.ip,
    },
  );

  return { registro, origen: resolved.origen };
}
