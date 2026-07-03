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
  evolucion?: {
    texto: string;
    registradoEn?: string;
    gpsRegistroId?: string;
  };
  pacienteId?: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    domicilio: string;
    descripcion?: string;
  };
  empresaId?: { nombre: string };
  agendaId?: {
    nombre?: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
  };
  fechaHoraProgramada: string;
};

type GpsData = {
  id: string;
  origen: GpsOrigen;
  lat?: number;
  lng?: number;
  accuracy?: number;
  timestamp?: string;
} | null;

type VentanaPaciente = {
  status: "before_window" | "in_window" | "expired";
  validFrom: string;
  tokenExpiraEn: string;
};

function agendaLabel(agenda?: TurnoDetalle["agendaId"]) {
  if (!agenda) return null;
  const fecha = new Date(agenda.fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  return `${agenda.nombre || "Agenda"} · ${fecha} · ${agenda.horaInicio}–${agenda.horaFin}`;
}

function ventanaPacienteMensaje(ventana: VentanaPaciente): string {
  const format = (iso: string) =>
    new Date(iso).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Argentina/Buenos_Aires",
    });

  switch (ventana.status) {
    case "before_window":
      return `El paciente podrá ingresar desde ${format(ventana.validFrom)}. Podés iniciar la consulta y esperar en la sala.`;
    case "expired":
      return `El link del paciente expiró el ${format(ventana.tokenExpiraEn)}.`;
    default:
      return `El paciente puede ingresar hasta ${format(ventana.tokenExpiraEn)}.`;
  }
}

export function ConsultaProfesionalPanel({ turnoId }: { turnoId: string }) {
  const router = useRouter();
  const [turno, setTurno] = useState<TurnoDetalle | null>(null);
  const [gps, setGps] = useState<GpsData>(null);
  const [ventanaPaciente, setVentanaPaciente] = useState<VentanaPaciente | null>(null);
  const [evolucion, setEvolucion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [savingEvolucion, setSavingEvolucion] = useState(false);

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
    setVentanaPaciente(data.ventanaPaciente ?? null);
    setEvolucion(
      data.turno?.evolucion?.texto ?? data.turno?.notasProfesional ?? "",
    );
    setVideoEnabled(data.turno?.estado === "en_curso");
    setLoading(false);
  }, [turnoId]);

  useEffect(() => {
    void load();
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

  async function guardarEvolucion() {
    if (!evolucion.trim()) {
      setError("Escribí la evolución antes de guardar");
      return;
    }

    setSavingEvolucion(true);
    setError(null);

    const res = await fetch(`/api/profesional/turnos/${turnoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "evolucion", evolucion }),
    });

    setSavingEvolucion(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo guardar la evolución");
      return;
    }

    await load();
  }

  async function cerrarConsulta(estado: "finalizado" | "ausente") {
    if (!evolucion.trim()) {
      setError(
        estado === "finalizado"
          ? "La evolución es obligatoria para finalizar la consulta"
          : "La evolución es obligatoria al marcar ausente",
      );
      return;
    }

    const res = await fetch(`/api/profesional/turnos/${turnoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, evolucion }),
    });

    if (res.ok) {
      router.push("/profesional");
      router.refresh();
      return;
    }

    const data = await res.json();
    setError(
      typeof data.error === "string"
        ? data.error
        : "No se pudo cerrar la consulta",
    );
  }

  if (loading) {
    return <p className="text-mist-400">Cargando consulta…</p>;
  }

  if (error && !turno) {
    return (
      <div className="space-y-4">
        <p className="text-signal-alert">{error}</p>
        <Link href="/profesional" className="text-clinical-700 hover:underline">
          Volver a la agenda
        </Link>
      </div>
    );
  }

  if (!turno) {
    return null;
  }

  const paciente = turno.pacienteId;
  const fecha = new Date(turno.fechaHoraProgramada).toLocaleString("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const agenda = agendaLabel(turno.agendaId);
  const evolucionGuardada = Boolean(turno.evolucion?.texto);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
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
          {agenda && <p className="text-sm text-clinical-700">{agenda}</p>}
          {ventanaPaciente && (
            <p
              className={`mt-2 rounded-lg p-3 text-sm ${
                ventanaPaciente.status === "in_window"
                  ? "bg-signal-verified/10 text-clinical-900"
                  : "bg-paper-50 text-mist-400"
              }`}
            >
              {ventanaPacienteMensaje(ventanaPaciente)}
            </p>
          )}
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
            Ubicación del paciente
          </p>
          {gps ? (
            <div className="space-y-2">
              <GpsPanel
                origen={gps.origen}
                lat={gps.lat}
                lng={gps.lng}
                accuracy={gps.accuracy}
              />
              <p className="text-xs text-mist-400">
                Registro GPS vinculado a la evolución al guardar o finalizar.
              </p>
            </div>
          ) : (
            <p className="text-sm text-mist-400">
              El paciente aún no compartió ubicación.
            </p>
          )}
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-clinical-900">Evolución clínica</span>
          <textarea
            value={evolucion}
            onChange={(e) => setEvolucion(e.target.value)}
            rows={4}
            disabled={turno.estado === "finalizado" || turno.estado === "ausente"}
            className="w-full rounded-lg border border-paper-100 bg-paper-50 px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-clinical-700 disabled:opacity-70"
            placeholder="Registrá la evolución de la consulta"
          />
        </label>

        {evolucionGuardada && (
          <p className="text-xs text-signal-verified">
            Evolución guardada
            {turno.evolucion?.gpsRegistroId ? " con ubicación vinculada" : ""}.
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-signal-alert">
            {error}
          </p>
        )}

        {turno.estado === "en_curso" && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={guardarEvolucion}
              disabled={savingEvolucion}
              className="rounded-lg border border-clinical-700 px-4 py-2 text-sm font-medium text-clinical-700 hover:bg-paper-50 disabled:opacity-60"
            >
              {savingEvolucion ? "Guardando…" : "Guardar evolución"}
            </button>
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
