"use client";

import { useCallback, useEffect, useState } from "react";
import { useTurnosSse } from "@/hooks/use-turnos-sse";
import type { TurnoEstado } from "@/models/types";

type AgendaRef = {
  nombre?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
};

type Turno = {
  _id: string;
  fechaHoraProgramada: string;
  estado: TurnoEstado;
  consultaUrl?: string;
  pacienteId?: { nombre: string; apellido: string; email: string };
  profesionalId?: { nombre: string; apellido: string } | null;
  agendaId?: AgendaRef;
};

const estadoLabels: Record<TurnoEstado, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_curso: "En curso",
  finalizado: "Finalizado",
  ausente: "Ausente",
  cancelado: "Cancelado",
};

const estadoStyles: Record<TurnoEstado, string> = {
  pendiente: "bg-mist-400/10 text-mist-400",
  confirmado: "bg-clinical-700/10 text-clinical-700",
  en_curso: "bg-signal-verified/10 text-signal-verified",
  finalizado: "bg-clinical-900/10 text-clinical-900",
  ausente: "bg-signal-alert/10 text-signal-alert",
  cancelado: "bg-mist-400/10 text-mist-400 line-through",
};

function agendaLabel(agenda?: AgendaRef) {
  if (!agenda) return "—";
  const fecha = new Date(agenda.fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  return `${agenda.nombre || "Agenda"} (${fecha})`;
}

export function TurnosEmpresaPanel() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }

      const params = new URLSearchParams();
      if (estado) params.set("estado", estado);

      const res = await fetch(`/api/empresa/turnos?${params.toString()}`);
      const data = await res.json();
      setTurnos(data.turnos ?? []);
      setLoading(false);
    },
    [estado],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useTurnosSse({
    onConnected: () => setLive(true),
    onTurnoActualizado: () => {
      void load({ silent: true });
    },
    onPoll: () => {
      void load({ silent: true });
    },
  });

  async function cancelar(id: string) {
    const res = await fetch(`/api/empresa/turnos/${id}`, { method: "PATCH" });
    if (res.ok) {
      await load({ silent: true });
    }
  }

  async function copyLink(turno: Turno) {
    if (!turno.consultaUrl) return;
    await navigator.clipboard.writeText(turno.consultaUrl);
    setCopiedId(turno._id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return <p className="text-mist-400">Cargando turnos…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm">
          <span className="font-medium text-clinical-900">Filtrar por estado</span>
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
        <p className="text-xs text-mist-400">
          {live ? "Actualización en tiempo real activa" : "Sincronizando turnos…"}
        </p>
      </div>

      {turnos.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-mist-400 ring-1 ring-paper-100">
          No hay turnos con los filtros seleccionados.
        </p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {turnos.map((turno) => {
              const fecha = new Date(turno.fechaHoraProgramada).toLocaleString(
                "es-AR",
                { dateStyle: "short", timeStyle: "short" },
              );
              const paciente = turno.pacienteId
                ? `${turno.pacienteId.nombre} ${turno.pacienteId.apellido}`
                : "—";
              const puedeCancelar =
                turno.estado !== "en_curso" &&
                turno.estado !== "finalizado" &&
                turno.estado !== "cancelado";

              return (
                <article
                  key={turno._id}
                  className="rounded-xl bg-white p-4 ring-1 ring-paper-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-data text-sm text-clinical-900">{fecha}</p>
                      <p className="mt-1 font-medium text-clinical-900">{paciente}</p>
                      <p className="text-xs text-mist-400">{agendaLabel(turno.agendaId)}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${estadoStyles[turno.estado]}`}
                    >
                      {estadoLabels[turno.estado]}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {turno.consultaUrl && (
                      <button
                        type="button"
                        onClick={() => copyLink(turno)}
                        className="text-xs font-medium text-clinical-700 hover:underline"
                      >
                        {copiedId === turno._id ? "Copiado" : "Copiar link paciente"}
                      </button>
                    )}
                    {puedeCancelar && (
                      <button
                        type="button"
                        onClick={() => cancelar(turno._id)}
                        className="text-xs font-medium text-signal-alert hover:underline"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-xl bg-white ring-1 ring-paper-100 md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-paper-100 text-mist-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Paciente</th>
                  <th className="px-4 py-3 font-medium">Agenda</th>
                  <th className="px-4 py-3 font-medium">Profesional</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((turno) => {
                  const fecha = new Date(turno.fechaHoraProgramada).toLocaleString(
                    "es-AR",
                    { dateStyle: "short", timeStyle: "short" },
                  );
                  const paciente = turno.pacienteId
                    ? `${turno.pacienteId.nombre} ${turno.pacienteId.apellido}`
                    : "—";
                  const profesional = turno.profesionalId
                    ? `${turno.profesionalId.nombre} ${turno.profesionalId.apellido}`
                    : "Sin asignar";
                  const puedeCancelar =
                    turno.estado !== "en_curso" &&
                    turno.estado !== "finalizado" &&
                    turno.estado !== "cancelado";

                  return (
                    <tr key={turno._id} className="border-b border-paper-50">
                      <td className="px-4 py-3 font-data text-clinical-900">{fecha}</td>
                      <td className="px-4 py-3 text-clinical-900">{paciente}</td>
                      <td className="px-4 py-3 text-mist-400">
                        {agendaLabel(turno.agendaId)}
                      </td>
                      <td className="px-4 py-3 text-mist-400">{profesional}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${estadoStyles[turno.estado]}`}
                        >
                          {estadoLabels[turno.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-3">
                          {turno.consultaUrl && (
                            <button
                              type="button"
                              onClick={() => copyLink(turno)}
                              className="text-clinical-700 hover:underline"
                            >
                              {copiedId === turno._id ? "Copiado" : "Copiar link"}
                            </button>
                          )}
                          {puedeCancelar && (
                            <button
                              type="button"
                              onClick={() => cancelar(turno._id)}
                              className="text-signal-alert hover:underline"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
