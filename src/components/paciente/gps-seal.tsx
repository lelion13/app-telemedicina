import type { GpsOrigen } from "@/models/types";

type GpsSealProps = {
  estado: "pendiente" | GpsOrigen;
  className?: string;
};

const LABELS: Record<GpsSealProps["estado"], string> = {
  pendiente: "Verificando ubicación…",
  navegador: "Ubicación verificada",
  ip_fallback: "Ubicación aproximada",
  no_verificado: "Ubicación no verificada",
};

const COLORS: Record<GpsSealProps["estado"], string> = {
  pendiente: "border-mist-400 text-mist-400",
  navegador: "border-signal-verified text-signal-verified",
  ip_fallback: "border-signal-warn text-signal-warn",
  no_verificado: "border-signal-alert text-signal-alert",
};

export function GpsSeal({ estado, className = "" }: GpsSealProps) {
  const pulse = estado === "pendiente";

  return (
    <div
      className={`flex flex-col items-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${COLORS[estado]} ${
          pulse ? "animate-[gps-breathe_2s_ease-in-out_infinite]" : ""
        }`}
      >
        <span className="font-data text-xs uppercase tracking-wide">
          GPS
        </span>
      </div>
      <p className="text-center text-sm font-medium">{LABELS[estado]}</p>
    </div>
  );
}
