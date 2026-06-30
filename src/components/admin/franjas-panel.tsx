"use client";

import { useCallback, useEffect, useState } from "react";
import { DIA_SEMANA_LABELS, type DiaSemana } from "@/models/types";

type Franja = {
  _id: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  activa: boolean;
};

const emptyForm = {
  diaSemana: "1",
  horaInicio: "09:00",
  horaFin: "13:00",
};

export function FranjasPanel() {
  const [franjas, setFranjas] = useState<Franja[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/franjas");
    const data = await res.json();
    setFranjas(data.franjas ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      diaSemana: Number(form.diaSemana),
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
    };

    const res = await fetch(
      editingId ? `/api/admin/franjas/${editingId}` : "/api/admin/franjas",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      setError("No se pudo guardar la franja");
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    await load();
  }

  async function toggleActiva(franja: Franja) {
    await fetch(`/api/admin/franjas/${franja._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !franja.activa }),
    });
    await load();
  }

  if (loading) {
    return <p className="text-mist-400">Cargando franjas…</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section className="rounded-xl bg-white ring-1 ring-paper-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-paper-100 text-mist-400">
            <tr>
              <th className="px-4 py-3 font-medium">Día</th>
              <th className="px-4 py-3 font-medium">Inicio</th>
              <th className="px-4 py-3 font-medium">Fin</th>
              <th className="px-4 py-3 font-medium">Activa</th>
            </tr>
          </thead>
          <tbody>
            {franjas.map((franja) => (
              <tr key={franja._id} className="border-b border-paper-50">
                <td className="px-4 py-3 text-clinical-900">
                  {DIA_SEMANA_LABELS[franja.diaSemana]}
                </td>
                <td className="px-4 py-3 font-data">{franja.horaInicio}</td>
                <td className="px-4 py-3 font-data">{franja.horaFin}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActiva(franja)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      franja.activa
                        ? "bg-signal-verified/10 text-signal-verified"
                        : "bg-mist-400/10 text-mist-400"
                    }`}
                  >
                    {franja.activa ? "Activa" : "Inactiva"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl bg-white p-5 ring-1 ring-paper-100">
        <h2 className="font-display text-lg font-semibold text-clinical-900">
          {editingId ? "Editar franja" : "Nueva franja"}
        </h2>
        {error && <p className="text-sm text-signal-alert">{error}</p>}
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-clinical-900">Día</span>
          <select
            value={form.diaSemana}
            onChange={(e) => setForm({ ...form, diaSemana: e.target.value })}
            className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3"
          >
            {Object.entries(DIA_SEMANA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-clinical-900">Hora inicio</span>
          <input
            type="time"
            required
            value={form.horaInicio}
            onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
            className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-clinical-900">Hora fin</span>
          <input
            type="time"
            required
            value={form.horaFin}
            onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
            className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3"
          />
        </label>
        <button type="submit" className="rounded-lg bg-clinical-700 px-4 py-2 text-sm font-medium text-white hover:bg-clinical-900">
          {editingId ? "Guardar" : "Crear"}
        </button>
      </form>
    </div>
  );
}
