"use client";

import { useCallback, useEffect, useState } from "react";

type EmpresaOption = {
  _id: string;
  nombre: string;
};

type AgendaEmpresa = {
  _id: string;
  nombre: string;
};

type Agenda = {
  _id: string;
  nombre?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionTurnoMinutos: number;
  empresaIds: AgendaEmpresa[] | string[];
  activa: boolean;
};

type SlotStatus = {
  hora: string;
  ocupado: boolean;
  turnoId?: string;
  estado?: string;
};

const emptyForm = {
  nombre: "",
  fecha: "",
  horaInicio: "09:00",
  horaFin: "12:00",
  duracionTurnoMinutos: "15",
  todasEmpresas: true,
  empresaIds: [] as string[],
};

function formatAgendaFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function toDateInputValue(fecha: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(fecha));
}

function empresaLabel(agenda: Agenda) {
  const empresas = agenda.empresaIds ?? [];
  if (!Array.isArray(empresas) || empresas.length === 0) {
    return "Todas las empresas";
  }

  return empresas
    .map((item) => (typeof item === "string" ? item : item.nombre))
    .join(", ");
}

export function AgendasPanel() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [agendasRes, empresasRes] = await Promise.all([
      fetch("/api/administrativo/agendas"),
      fetch("/api/administrativo/empresas"),
    ]);

    const agendasData = await agendasRes.json();
    const empresasData = await empresasRes.json();

    setAgendas(agendasData.agendas ?? []);
    setEmpresas(empresasData.empresas ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      nombre: form.nombre.trim() || undefined,
      fecha: form.fecha,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      duracionTurnoMinutos: Number(form.duracionTurnoMinutos),
      empresaIds: form.todasEmpresas ? [] : form.empresaIds,
    };

    const res = await fetch(
      editingId
        ? `/api/administrativo/agendas/${editingId}`
        : "/api/administrativo/agendas",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const data = await res.json();
      setError(
        typeof data.error === "string"
          ? data.error
          : "No se pudo guardar la agenda",
      );
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    await load();
  }

  async function toggleActiva(agenda: Agenda) {
    await fetch(`/api/administrativo/agendas/${agenda._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !agenda.activa }),
    });
    await load();
  }

  function startEdit(agenda: Agenda) {
    const empresaIds = (agenda.empresaIds ?? []).map((item) =>
      typeof item === "string" ? item : item._id,
    );

    setEditingId(agenda._id);
    setForm({
      nombre: agenda.nombre ?? "",
      fecha: toDateInputValue(agenda.fecha),
      horaInicio: agenda.horaInicio,
      horaFin: agenda.horaFin,
      duracionTurnoMinutos: String(agenda.duracionTurnoMinutos),
      todasEmpresas: empresaIds.length === 0,
      empresaIds,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function toggleSlots(agendaId: string) {
    if (expandedId === agendaId) {
      setExpandedId(null);
      setSlots([]);
      return;
    }

    setExpandedId(agendaId);
    setSlotsLoading(true);

    const res = await fetch(`/api/administrativo/agendas/${agendaId}/slots`);
    const data = await res.json();
    setSlots(data.slots ?? []);
    setSlotsLoading(false);
  }

  function toggleEmpresa(empresaId: string) {
    setForm((current) => {
      const selected = current.empresaIds.includes(empresaId)
        ? current.empresaIds.filter((id) => id !== empresaId)
        : [...current.empresaIds, empresaId];

      return { ...current, empresaIds: selected };
    });
  }

  if (loading) {
    return <p className="text-mist-400">Cargando agendas…</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section className="space-y-4">
        {agendas.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-sm text-mist-400 ring-1 ring-paper-100">
            Todavía no hay agendas. Creá la primera con el formulario.
          </p>
        ) : (
          <div className="space-y-3">
            {agendas.map((agenda) => (
              <article
                key={agenda._id}
                className="rounded-xl bg-white p-4 ring-1 ring-paper-100 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-display text-lg font-semibold text-clinical-900">
                      {agenda.nombre || "Agenda sin nombre"}
                    </h3>
                    <p className="text-sm text-clinical-700">
                      {formatAgendaFecha(agenda.fecha)} · {agenda.horaInicio}–
                      {agenda.horaFin} · {agenda.duracionTurnoMinutos} min/turno
                    </p>
                    <p className="text-xs text-mist-400">{empresaLabel(agenda)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActiva(agenda)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        agenda.activa
                          ? "bg-signal-verified/10 text-signal-verified"
                          : "bg-mist-400/10 text-mist-400"
                      }`}
                    >
                      {agenda.activa ? "Activa" : "Inactiva"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(agenda)}
                      className="rounded-lg px-3 py-1 text-xs font-medium text-clinical-700 ring-1 ring-paper-100 hover:bg-paper-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSlots(agenda._id)}
                      className="rounded-lg px-3 py-1 text-xs font-medium text-clinical-700 ring-1 ring-paper-100 hover:bg-paper-50"
                    >
                      {expandedId === agenda._id ? "Ocultar slots" : "Ver slots"}
                    </button>
                  </div>
                </div>

                {expandedId === agenda._id && (
                  <div className="mt-4 border-t border-paper-50 pt-4">
                    {slotsLoading ? (
                      <p className="text-sm text-mist-400">Cargando slots…</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {slots.map((slot) => (
                          <span
                            key={slot.hora}
                            className={`inline-flex rounded-full px-2.5 py-1 font-data text-xs font-medium ${
                              slot.ocupado
                                ? "bg-clinical-700/10 text-clinical-700"
                                : "bg-paper-100 text-mist-400"
                            }`}
                          >
                            {slot.hora}
                            {slot.ocupado ? ` · ${slot.estado}` : " · libre"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <form
        onSubmit={handleSubmit}
        className="h-fit space-y-4 rounded-xl bg-white p-5 ring-1 ring-paper-100 lg:sticky lg:top-6"
      >
        <h2 className="font-display text-lg font-semibold text-clinical-900">
          {editingId ? "Editar agenda" : "Nueva agenda"}
        </h2>
        {error && <p className="text-sm text-signal-alert">{error}</p>}

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-clinical-900">Nombre (opcional)</span>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3"
            placeholder="Guardia matutina"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-clinical-900">Día</span>
          <input
            type="date"
            required
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-clinical-900">Inicio</span>
            <input
              type="time"
              required
              value={form.horaInicio}
              onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
              className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-clinical-900">Fin</span>
            <input
              type="time"
              required
              value={form.horaFin}
              onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
              className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3"
            />
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-clinical-900">Duración por turno (min)</span>
          <input
            type="number"
            required
            min={5}
            max={240}
            step={5}
            value={form.duracionTurnoMinutos}
            onChange={(e) =>
              setForm({ ...form, duracionTurnoMinutos: e.target.value })
            }
            className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3"
          />
        </label>

        <fieldset className="space-y-2 text-sm">
          <legend className="font-medium text-clinical-900">Empresas</legend>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.todasEmpresas}
              onChange={(e) =>
                setForm({
                  ...form,
                  todasEmpresas: e.target.checked,
                  empresaIds: e.target.checked ? [] : form.empresaIds,
                })
              }
            />
            <span>Todas las empresas</span>
          </label>
          {!form.todasEmpresas && (
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-paper-100 p-3">
              {empresas.map((empresa) => (
                <label key={empresa._id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.empresaIds.includes(empresa._id)}
                    onChange={() => toggleEmpresa(empresa._id)}
                  />
                  <span>{empresa.nombre}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            className="rounded-lg bg-clinical-700 px-4 py-2 text-sm font-medium text-white hover:bg-clinical-900"
          >
            {editingId ? "Guardar" : "Crear agenda"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg px-4 py-2 text-sm font-medium text-clinical-700 ring-1 ring-paper-100 hover:bg-paper-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
