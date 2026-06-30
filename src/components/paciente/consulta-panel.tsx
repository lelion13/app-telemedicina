"use client";

import { useState } from "react";
import { PacienteVideoRoom } from "@/components/livekit/paciente-video-room";
import { GpsSeal } from "@/components/paciente/gps-seal";
import type { GpsOrigen } from "@/models/types";

type ConsultaPacientePanelProps = {
  token: string;
  fechaHoraProgramada: string;
  pacienteNombre: string;
  profesionalNombre: string | null;
  turnoEstado: string;
  gpsInicial: {
    origen: GpsOrigen;
    lat?: number;
    lng?: number;
    accuracy?: number;
  } | null;
};

type Paso = "bienvenida" | "consentimiento" | "espera" | "consulta";

type GpsUiEstado = "idle" | "pendiente" | GpsOrigen;

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "full",
    timeStyle: "short",
  });
}

export function ConsultaPacientePanel({
  token,
  fechaHoraProgramada,
  pacienteNombre,
  profesionalNombre,
  turnoEstado,
  gpsInicial,
}: ConsultaPacientePanelProps) {
  const [paso, setPaso] = useState<Paso>(gpsInicial ? "espera" : "bienvenida");
  const [gpsEstado, setGpsEstado] = useState<GpsUiEstado>(
    gpsInicial?.origen ?? "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [gpsCompletado, setGpsCompletado] = useState(!!gpsInicial);

  async function enviarGps(payload: {
    permisoDenegado: boolean;
    lat?: number;
    lng?: number;
    accuracy?: number;
  }) {
    setError(null);
    setGpsEstado("pendiente");

    const res = await fetch("/api/gps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...payload }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No pudimos registrar tu ubicación");
      setGpsEstado("no_verificado");
      setGpsCompletado(true);
      setPaso("espera");
      return;
    }

    const data = await res.json();
    setGpsEstado(data.origen);
    setGpsCompletado(true);
    setPaso("espera");
  }

  async function compartirUbicacion() {
    setGpsEstado("pendiente");

    if (!navigator.geolocation) {
      await enviarGps({ permisoDenegado: true });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void enviarGps({
          permisoDenegado: false,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => {
        void enviarGps({ permisoDenegado: true });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  async function continuarSinUbicacion() {
    await enviarGps({ permisoDenegado: true });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-8">
      <header className="mb-8 text-center">
        <p className="font-display text-sm uppercase tracking-wide text-clinical-700">
          Telemedicina Lion
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-clinical-900">
          Tu consulta
        </h1>
      </header>

      {paso === "bienvenida" && (
        <section className="flex flex-1 flex-col gap-6">
          <div className="rounded-2xl bg-paper-100 p-6 text-center">
            <p className="text-base text-clinical-700">
              Hola <strong>{pacienteNombre}</strong>
            </p>
            <p className="font-display mt-4 text-2xl text-clinical-900">
              {formatFechaHora(fechaHoraProgramada)}
            </p>
            {profesionalNombre && (
              <p className="mt-3 text-sm text-clinical-700">
                Profesional: <strong>{profesionalNombre}</strong>
              </p>
            )}
          </div>

          <p className="text-center text-sm leading-relaxed text-clinical-700">
            Antes de ingresar, necesitamos verificar tu ubicación para confirmar
            la asistencia a la teleconsulta.
          </p>

          <button
            type="button"
            onClick={() => setPaso("consentimiento")}
            className="min-h-14 w-full rounded-xl bg-clinical-700 px-6 py-4 font-display text-lg text-white transition hover:bg-clinical-900"
          >
            Continuar
          </button>
        </section>
      )}

      {paso === "consentimiento" && !gpsCompletado && (
        <section className="flex flex-1 flex-col gap-6">
          <div className="rounded-2xl border border-paper-100 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-clinical-900">
              Consentimiento de ubicación
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-clinical-700">
              De acuerdo con la Ley 25.326 de Protección de Datos Personales,
              solicitamos tu ubicación únicamente para verificar que estás
              asistiendo a la consulta desde el domicilio registrado. Los datos
              se usan con esa finalidad y quedan registrados para auditoría.
            </p>
          </div>

          {gpsEstado === "pendiente" && (
            <GpsSeal estado="pendiente" />
          )}

          {error && (
            <p className="rounded-lg bg-signal-alert/10 px-4 py-3 text-sm text-signal-alert">
              {error}
            </p>
          )}

          <div className="mt-auto flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void compartirUbicacion()}
              disabled={gpsEstado === "pendiente"}
              className="min-h-14 w-full rounded-xl bg-clinical-700 px-6 py-4 font-display text-lg text-white transition hover:bg-clinical-900 disabled:opacity-50"
            >
              Compartir ubicación
            </button>
            <button
              type="button"
              onClick={() => void continuarSinUbicacion()}
              disabled={gpsEstado === "pendiente"}
              className="min-h-12 w-full rounded-xl border border-clinical-700 px-6 py-3 text-sm font-medium text-clinical-700 transition hover:bg-paper-100 disabled:opacity-50"
            >
              Continuar sin compartir
            </button>
          </div>
        </section>
      )}

      {(paso === "espera" || (paso === "consentimiento" && gpsCompletado)) && (
        <section className="flex flex-1 flex-col gap-6">
          <div className="rounded-2xl bg-paper-100 p-6 text-center">
            <p className="font-data text-sm text-clinical-700">
              {formatFechaHora(fechaHoraProgramada)}
            </p>
            {profesionalNombre && (
              <p className="mt-2 text-sm text-clinical-700">
                Con <strong>{profesionalNombre}</strong>
              </p>
            )}
          </div>

          {gpsEstado !== "idle" && gpsEstado !== "pendiente" && (
            <GpsSeal estado={gpsEstado} />
          )}

          <p className="text-center text-sm text-clinical-700">
            {gpsEstado === "navegador"
              ? "Tu ubicación fue verificada correctamente."
              : gpsEstado === "ip_fallback"
                ? "Registramos una ubicación aproximada por red."
                : "Podés ingresar aunque la ubicación no esté verificada."}
          </p>

          <button
            type="button"
            onClick={() => setPaso("consulta")}
            className="mt-auto min-h-14 w-full rounded-xl bg-clinical-700 px-6 py-4 font-display text-lg text-white transition hover:bg-clinical-900"
          >
            Ingresar a la consulta
          </button>
        </section>
      )}

      {paso === "consulta" && (
        <section className="flex flex-1 flex-col gap-4">
          <PacienteVideoRoom patientToken={token} turnoEstado={turnoEstado} />
        </section>
      )}
    </main>
  );
}
