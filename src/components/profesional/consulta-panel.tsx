"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfesionalVideoRoom } from "@/components/livekit/profesional-video-room";
import { GpsPanel } from "@/components/profesional/gps-panel";
import type { GpsOrigen, TurnoEstado } from "@/models/types";

type TurnoDetalle = {
  _id: string;
  estado: TurnoEstado;
  notasProfesional?: string;
  pacienteId?: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    domicilio: string;
    descripcion?: string;
  };
  empresaId?: { nombre: string };
  fechaHoraProgramada: string;
};

type GpsData = {
  origen: GpsOrigen;
  lat?: number;
  lng?: number;
  accuracy?: number;
} | null;

export function ConsultaProfesionalPanel({ turnoId }: { turnoId: string }) {
  const router = useRouter();
  const [turno, setTurno] = useState<TurnoDetalle | null>(null);
  const [gps, setGps] = useState<GpsData>(null);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/profesional/turnos/${turnoId}`);
    if (!res.ok) {
      setError("Turno no encontrado");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTurno(data.turno);
    setGps(data.gps ?? null);
    setNotas(data.turno?.notasProfesional ?? "");
    setVideoEnabled(data.turno?.estado === "en_curso");
    setLoading(false);
  }, [turnoId]);

  useEffect(() => {
    load();
  }, [load]);

  async function iniciarConsulta() {
    const res = await fetch(`/api/profesional/turnos/${turnoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "iniciar" }),
    });
    if (res.ok) {
      setVideoEnabled(true);
      await load();
    }
  }

  async function cerrarConsulta(estado: "finalizado" | "ausente") {
    const res = await fetch(`/api/profesional/turnos/${turnoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, notasProfesional: notas }),
    });

    if (res.ok) {
      router.push("/profesional");
      router.refresh();
      return;
    }

    const data = await res.json();
    setError(data.error ?? "No se pudo cerrar la consulta");
  }

  if (loading) {
    return <p className="text-mist-400">Cargando consulta…</p>;
  }

  if (error || !turno) {
    return (
      <div className="space-y-4">
        <p className="text-signal-alert">{error ?? "Turno no disponible"}</p>
        <Link href="/profesional" className="text-clinical-700 hover:underline">
          Volver a la agenda
        </Link>
      </div>
    );
  }

  const paciente = turno.pacienteId;
  const fecha = new Date(turno.fechaHoraProgramada).toLocaleString("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="min-h-[320px]">
        <ProfesionalVideoRoom turnoId={turnoId} enabled={videoEnabled} />
        {turno.estado !== "en_curso" &&
          turno.estado !== "finalizado" &&
          turno.estado !== "ausente" && (
            <button
              type="button"
              onClick={iniciarConsulta}
              className="mt-4 w-full rounded-lg bg-clinical-700 px-5 py-3 text-sm font-medium text-white hover:bg-clinical-900 lg:w-auto"
            >
              Iniciar consulta
            </button>
          )}
      </section>

      <aside className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-paper-100">
        <div>
          <Link href="/profesional" className="text-sm text-clinical-700 hover:underline">
            ← Agenda
          </Link>
          <h2 className="mt-2 font-display text-xl font-semibold text-clinical-900">
            {paciente ? `${paciente.nombre} ${paciente.apellido}` : "Paciente"}
          </h2>
          <p className="text-sm text-mist-400">{fecha}</p>
          <p className="text-sm text-mist-400">{turno.empresaId?.nombre}</p>
        </div>

        {paciente && (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-mist-400">Email</dt>
              <dd className="text-clinical-900">{paciente.email}</dd>
            </div>
            <div>
              <dt className="text-mist-400">Teléfono</dt>
              <dd className="text-clinical-900">{paciente.telefono}</dd>
            </div>
            <div>
              <dt className="text-mist-400">Domicilio</dt>
              <dd className="text-clinical-900">{paciente.domicilio}</dd>
            </div>
            {paciente.descripcion && (
              <div>
                <dt className="text-mist-400">Descripción</dt>
                <dd className="text-clinical-900">{paciente.descripcion}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="rounded-lg bg-paper-50 p-3">
          <p className="mb-2 text-sm font-medium text-clinical-900">
            Verificación GPS
          </p>
          {gps ? (
            <GpsPanel
              origen={gps.origen}
              lat={gps.lat}
              lng={gps.lng}
              accuracy={gps.accuracy}
            />
          ) : (
            <p className="text-sm text-mist-400">
              El paciente aún no completó el flujo de ubicación.
            </p>
          )}
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-clinical-900">Notas</span>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-paper-100 bg-paper-50 px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-clinical-700"
            placeholder="Observaciones de la consulta"
          />
        </label>

        {turno.estado === "en_curso" && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => cerrarConsulta("finalizado")}
              className="rounded-lg bg-signal-verified px-4 py-2 text-sm font-medium text-white"
            >
              Marcar finalizado
            </button>
            <button
              type="button"
              onClick={() => cerrarConsulta("ausente")}
              className="rounded-lg bg-signal-alert px-4 py-2 text-sm font-medium text-white"
            >
              Marcar ausente
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
