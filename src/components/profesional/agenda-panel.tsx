"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { TurnoEstado } from "@/models/types";

type Turno = {
  _id: string;
  fechaHoraProgramada: string;
  estado: TurnoEstado;
  pacienteId?: { nombre: string; apellido: string };
  empresaId?: { nombre: string };
  agendaId?: { nombre?: string; fecha: string; horaInicio: string; horaFin: string };
  profesionalId?: { nombre: string; apellido: string } | null;
  acciones?: { puedeTomar: boolean; puedeAtender: boolean };
};

function agendaResumen(agenda?: Turno["agendaId"]) {
  if (!agenda) return null;
  const fecha = new Date(agenda.fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  return `${agenda.nombre || "Agenda"} (${fecha})`;
}

const estadoLabels: Record<TurnoEstado, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_curso: "En curso",
  finalizado: "Finalizado",
  ausente: "Ausente",
  cancelado: "Cancelado",
};

export function AgendaProfesionalPanel() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [estado, setEstado] = useState("");
  const [soloHoy, setSoloHoy] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (estado) params.set("estado", estado);
    params.set("soloHoy", soloHoy ? "true" : "false");

    const res = await fetch(`/api/profesional/turnos?${params.toString()}`);
    const data = await res.json();
    setTurnos(data.turnos ?? []);
    setLoading(false);
  }, [estado, soloHoy]);

  useEffect(() => {
    load();
  }, [load]);

  async function tomarTurno(id: string) {
    const res = await fetch(`/api/profesional/turnos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "tomar" }),
    });
    if (res.ok) {
      await load();
    }
  }

  if (loading) {
    return <p className="text-mist-400">Cargando agenda…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <span className="font-medium text-clinical-900">Estado</span>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="h-10 rounded-lg border border-paper-100 bg-white px-3"
          >
            <option value="">Todos</option>
            {(Object.keys(estadoLabels) as TurnoEstado[]).map((key) => (
              <option key={key} value={key}>
                {estadoLabels[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={soloHoy}
            onChange={(e) => setSoloHoy(e.target.checked)}
            className="h-4 w-4 rounded border-paper-100"
          />
          <span className="text-clinical-700">Solo hoy</span>
        </label>
      </div>

      {turnos.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-mist-400 ring-1 ring-paper-100">
          No hay turnos para mostrar.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {turnos.map((turno) => {
            const fecha = new Date(turno.fechaHoraProgramada);
            const hora = fecha.toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const paciente = turno.pacienteId
              ? `${turno.pacienteId.nombre} ${turno.pacienteId.apellido}`
              : "—";
            const empresa = turno.empresaId?.nombre ?? "—";
            const agenda = agendaResumen(turno.agendaId);
            const puedeTomar = turno.acciones?.puedeTomar ?? false;
            const puedeAtender = turno.acciones?.puedeAtender ?? false;

            return (
              <article
                key={turno._id}
                className="rounded-xl bg-white p-5 ring-1 ring-paper-100"
              >
                <p className="font-display text-3xl font-semibold text-clinical-900">
                  {hora}
                </p>
                <p className="mt-1 text-clinical-900">{paciente}</p>
                <p className="text-sm text-mist-400">{empresa}</p>
                {agenda && <p className="text-xs text-clinical-700">{agenda}</p>}
                <p className="mt-2 inline-flex rounded-full bg-paper-50 px-2 py-0.5 text-xs font-medium text-clinical-700">
                  {estadoLabels[turno.estado]}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {puedeTomar && (
                    <button
                      type="button"
                      onClick={() => tomarTurno(turno._id)}
                      className="rounded-lg bg-clinical-700 px-4 py-2 text-sm font-medium text-white hover:bg-clinical-900"
                    >
                      Tomar turno
                    </button>
                  )}
                  {puedeAtender && (
                    <Link
                      href={`/profesional/consulta/${turno._id}`}
                      className="rounded-lg border border-clinical-700 px-4 py-2 text-sm font-medium text-clinical-700 hover:bg-paper-50"
                    >
                      Atender
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
