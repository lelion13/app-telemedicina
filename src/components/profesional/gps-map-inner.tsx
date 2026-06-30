"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GpsOrigen } from "@/models/types";
import { GpsSeal } from "@/components/paciente/gps-seal";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type GpsMapInnerProps = {
  lat: number;
  lng: number;
  origen: GpsOrigen;
};

export function GpsMapInner({ lat, lng, origen }: GpsMapInnerProps) {
  return (
    <div className="space-y-3">
      <GpsSeal estado={origen} className="scale-75" />
      <div className="h-40 overflow-hidden rounded-lg ring-1 ring-paper-100">
        <MapContainer
          center={[lat, lng]}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} icon={markerIcon} />
        </MapContainer>
      </div>
    </div>
  );
}
