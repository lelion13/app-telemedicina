"use client";

import { useCallback, useEffect, useState } from "react";
import type { TurnoEstado } from "@/models/types";

type AgendaOption = {
  _id: string;
  nombre?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
};

type Turno = {
  _id: string;
  fechaHoraProgramada: string;
  estado: TurnoEstado;
  pacienteId?: { nombre: string; apellido: string; email: string };
  profesionalId?: { nombre: string; apellido: string } | null;
  empresaId?: { nombre: string };
  agendaId?: AgendaOption;
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

function agendaLabel(agenda?: AgendaOption) {
  if (!agenda) return "—";
  const fecha = new Date(agenda.fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${agenda.nombre || "Agenda"} (${fecha} ${agenda.horaInicio})`;
}

export function TurnosMonitorPanel() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [agendas, setAgendas] = useState<AgendaOption[]>([]);
  const [agendaId, setAgendaId] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAgendas = useCallback(async () => {
    const res = await fetch("/api/administrativo/agendas");
    const data = await res.json();
    setAgendas(data.agendas ?? []);
  }, []);

  const loadTurnos = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (agendaId) params.set("agendaId", agendaId);
    if (estado) params.set("estado", estado);

    const res = await fetch(`/api/administrativo/turnos?${params.toString()}`);
    const data = await res.json();
    setTurnos(data.turnos ?? []);
    setLoading(false);
  }, [agendaId, estado]);

  useEffect(() => {
    void loadAgendas();
  }, [loadAgendas]);

  useEffect(() => {
    void loadTurnos();
  }, [loadTurnos]);

  if (loading) {
    return <p className="text-mist-400">Cargando turnos…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-clinical-900">Agenda</span>
          <select
            value={agendaId}
            onChange={(e) => setAgendaId(e.target.value)}
            className="h-10 w-full rounded-lg border border-paper-100 bg-white px-3"
          >
            <option value="">Todas las agendas</option>
            {agendas.map((agenda) => (
              <option key={agenda._id} value={agenda._id}>
                {agendaLabel(agenda)}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-clinical-900">Estado</span>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="h-10 w-full rounded-lg border border-paper-100 bg-white px-3"
          >
            <option value="">Todos</option>
            {(Object.keys(estadoLabels) as TurnoEstado[]).map((key) => (
              <option key={key} value={key}>
                {estadoLabels[key]}
              </option>
            ))}
          </select>
        </label>
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

              return (
                <article
                  key={turno._id}
                  className="rounded-xl bg-white p-4 ring-1 ring-paper-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-data text-sm text-clinical-900">{fecha}</p>
                      <p className="mt-1 font-medium text-clinical-900">{paciente}</p>
                      <p className="text-xs text-mist-400">
                        {turno.empresaId?.nombre ?? "—"} · {agendaLabel(turno.agendaId)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${estadoStyles[turno.estado]}`}
                    >
                      {estadoLabels[turno.estado]}
                    </span>
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
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Agenda</th>
                  <th className="px-4 py-3 font-medium">Profesional</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
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

                  return (
                    <tr key={turno._id} className="border-b border-paper-50">
                      <td className="px-4 py-3 font-data text-clinical-900">{fecha}</td>
                      <td className="px-4 py-3 text-clinical-900">{paciente}</td>
                      <td className="px-4 py-3 text-mist-400">
                        {turno.empresaId?.nombre ?? "—"}
                      </td>
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
