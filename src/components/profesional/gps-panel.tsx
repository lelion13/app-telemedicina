"use client";

import dynamic from "next/dynamic";
import type { GpsOrigen } from "@/models/types";
import { GpsSeal } from "@/components/paciente/gps-seal";

const GpsMapInner = dynamic(
  () =>
    import("@/components/profesional/gps-map-inner").then((mod) => mod.GpsMapInner),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-mist-400">Cargando mapa…</p>
    ),
  },
);

type GpsPanelProps = {
  origen: GpsOrigen;
  lat?: number;
  lng?: number;
  accuracy?: number;
};

export function GpsPanel({ origen, lat, lng, accuracy }: GpsPanelProps) {
  if (lat != null && lng != null) {
    return (
      <div className="space-y-2">
        <GpsMapInner lat={lat} lng={lng} origen={origen} />
        {accuracy != null && (
          <p className="font-data text-xs text-mist-400">
            Precisión: ~{Math.round(accuracy)} m
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-paper-50 p-3">
      <GpsSeal estado={origen} className="scale-75" />
      <p className="mt-2 text-center text-sm text-mist-400">
        Sin coordenadas registradas
      </p>
    </div>
  );
}
