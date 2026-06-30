"use client";

import { useCallback, useEffect, useState } from "react";

type Empresa = {
  _id: string;
  nombre: string;
  cuit?: string;
  contacto?: { email?: string; telefono?: string; direccion?: string };
  activa: boolean;
};

const emptyForm = {
  nombre: "",
  cuit: "",
  email: "",
  telefono: "",
  direccion: "",
};

export function EmpresasPanel() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/empresas");
    const data = await res.json();
    setEmpresas(data.empresas ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = {
      nombre: form.nombre,
      cuit: form.cuit || undefined,
      contacto: {
        email: form.email || undefined,
        telefono: form.telefono || undefined,
        direccion: form.direccion || undefined,
      },
    };

    const res = await fetch(
      editingId ? `/api/admin/empresas/${editingId}` : "/api/admin/empresas",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      setError("No se pudo guardar la empresa");
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    await load();
  }

  function startEdit(empresa: Empresa) {
    setEditingId(empresa._id);
    setForm({
      nombre: empresa.nombre,
      cuit: empresa.cuit ?? "",
      email: empresa.contacto?.email ?? "",
      telefono: empresa.contacto?.telefono ?? "",
      direccion: empresa.contacto?.direccion ?? "",
    });
  }

  async function deactivate(id: string) {
    await fetch(`/api/admin/empresas/${id}`, { method: "DELETE" });
    await load();
  }

  if (loading) {
    return <p className="text-mist-400">Cargando empresas…</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section className="rounded-xl bg-white ring-1 ring-paper-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-paper-100 text-mist-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">CUIT</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((empresa) => (
              <tr key={empresa._id} className="border-b border-paper-50">
                <td className="px-4 py-3 text-clinical-900">{empresa.nombre}</td>
                <td className="px-4 py-3 font-data text-mist-400">
                  {empresa.cuit || "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusPill active={empresa.activa} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(empresa)}
                      className="text-clinical-700 hover:underline"
                    >
                      Editar
                    </button>
                    {empresa.activa && (
                      <button
                        type="button"
                        onClick={() => deactivate(empresa._id)}
                        className="text-signal-alert hover:underline"
                      >
                        Desactivar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <form
        onSubmit={handleSubmit}
        className="h-fit space-y-4 rounded-xl bg-white p-5 ring-1 ring-paper-100"
      >
        <h2 className="font-display text-lg font-semibold text-clinical-900">
          {editingId ? "Editar empresa" : "Nueva empresa"}
        </h2>
        {error && <p className="text-sm text-signal-alert">{error}</p>}
        <Field label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required />
        <Field label="CUIT" value={form.cuit} onChange={(v) => setForm({ ...form, cuit: v })} />
        <Field label="Email contacto" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
        <Field label="Teléfono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
        <Field label="Dirección" value={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} />
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-clinical-700 px-4 py-2 text-sm font-medium text-white hover:bg-clinical-900">
            {editingId ? "Guardar" : "Crear"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm(emptyForm); }}
              className="rounded-lg px-4 py-2 text-sm text-mist-400 hover:bg-paper-100"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? "bg-signal-verified/10 text-signal-verified" : "bg-mist-400/10 text-mist-400"
      }`}
    >
      {active ? "Activa" : "Inactiva"}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-clinical-900">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3 outline-none focus-visible:ring-2 focus-visible:ring-clinical-700"
      />
    </label>
  );
}
