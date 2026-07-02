"use client";

import { useCallback, useEffect, useState } from "react";
import type { Rol } from "@/models/types";

type EmpresaOption = { _id: string; nombre: string; activa: boolean };

type Usuario = {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  activo: boolean;
  empresaId?: { _id: string; nombre: string } | string;
};

const ROL_LABELS: Record<Rol, string> = {
  admin: "Admin",
  administrativo: "Administrativo",
  empresa: "Empresa",
  profesional: "Profesional",
};

const emptyForm = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  rol: "profesional" as Rol,
  empresaId: "",
};

export function UsuariosPanel() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [usersRes, empresasRes] = await Promise.all([
      fetch("/api/admin/usuarios"),
      fetch("/api/admin/empresas"),
    ]);
    const usersData = await usersRes.json();
    const empresasData = await empresasRes.json();
    setUsuarios(usersData.usuarios ?? []);
    setEmpresas((empresasData.empresas ?? []).filter((e: EmpresaOption) => e.activa));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const payload: Record<string, unknown> = {
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      rol: form.rol,
      empresaId: form.rol === "empresa" ? form.empresaId : undefined,
    };

    if (!editingId || form.password) {
      payload.password = form.password;
    }

    const res = await fetch(
      editingId ? `/api/admin/usuarios/${editingId}` : "/api/admin/usuarios",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "No se pudo guardar el usuario");
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    await load();
  }

  function startEdit(usuario: Usuario) {
    setEditingId(usuario._id);
    const empresaId =
      typeof usuario.empresaId === "object" && usuario.empresaId
        ? usuario.empresaId._id
        : (usuario.empresaId as string) ?? "";

    setForm({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: "",
      rol: usuario.rol,
      empresaId,
    });
  }

  async function deactivate(id: string) {
    await fetch(`/api/admin/usuarios/${id}`, { method: "DELETE" });
    await load();
  }

  if (loading) {
    return <p className="text-mist-400">Cargando usuarios…</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section className="overflow-x-auto rounded-xl bg-white ring-1 ring-paper-100">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-paper-100 text-mist-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario._id} className="border-b border-paper-50">
                <td className="px-4 py-3 text-clinical-900">
                  {usuario.nombre} {usuario.apellido}
                </td>
                <td className="px-4 py-3 font-data text-mist-400">{usuario.email}</td>
                <td className="px-4 py-3 text-clinical-700">{ROL_LABELS[usuario.rol]}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      usuario.activo
                        ? "bg-signal-verified/10 text-signal-verified"
                        : "bg-mist-400/10 text-mist-400"
                    }`}
                  >
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(usuario)} className="text-clinical-700 hover:underline">
                      Editar
                    </button>
                    {usuario.activo && (
                      <button type="button" onClick={() => deactivate(usuario._id)} className="text-signal-alert hover:underline">
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

      <form onSubmit={handleSubmit} className="h-fit space-y-4 rounded-xl bg-white p-5 ring-1 ring-paper-100">
        <h2 className="font-display text-lg font-semibold text-clinical-900">
          {editingId ? "Editar usuario" : "Nuevo usuario"}
        </h2>
        {error && <p className="text-sm text-signal-alert">{error}</p>}
        <Input label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required />
        <Input label="Apellido" value={form.apellido} onChange={(v) => setForm({ ...form, apellido: v })} required />
        <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Input
          label={editingId ? "Nueva contraseña (opcional)" : "Contraseña"}
          type="password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
          required={!editingId}
        />
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-clinical-900">Rol</span>
          <select
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
            className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3 outline-none focus-visible:ring-2 focus-visible:ring-clinical-700"
          >
            <option value="admin">Admin</option>
            <option value="administrativo">Administrativo</option>
            <option value="empresa">Empresa</option>
            <option value="profesional">Profesional</option>
          </select>
        </label>
        {form.rol === "administrativo" && (
          <p className="text-xs text-mist-400">
            El administrativo crea agendas y ve todos los turnos del sistema.
          </p>
        )}
        {form.rol === "empresa" && (
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-clinical-900">Empresa</span>
            <select
              required
              value={form.empresaId}
              onChange={(e) => setForm({ ...form, empresaId: e.target.value })}
              className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3 outline-none focus-visible:ring-2 focus-visible:ring-clinical-700"
            >
              <option value="">Seleccioná una empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa._id} value={empresa._id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="submit" className="rounded-lg bg-clinical-700 px-4 py-2 text-sm font-medium text-white hover:bg-clinical-900">
          {editingId ? "Guardar" : "Crear"}
        </button>
      </form>
    </div>
  );
}

function Input({
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
