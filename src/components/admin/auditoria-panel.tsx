"use client";

import { useCallback, useEffect, useState } from "react";

type EmpresaOption = { _id: string; nombre: string };

export function AuditoriaPanel() {
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [tipo, setTipo] = useState<"gps" | "logs">("gps");
  const [turnoId, setTurnoId] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [registros, setRegistros] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/empresas")
      .then((res) => res.json())
      .then((data) => setEmpresas(data.empresas ?? []));
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ tipo });
    if (turnoId) params.set("turnoId", turnoId);
    if (empresaId) params.set("empresaId", empresaId);

    const res = await fetch(`/api/admin/auditoria?${params.toString()}`);
    const data = await res.json();
    setRegistros(data.registros ?? []);
    setLoading(false);
  }, [tipo, turnoId, empresaId]);

  useEffect(() => {
    search();
  }, [search]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-xl bg-white p-5 ring-1 ring-paper-100 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-clinical-900">Tipo</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "gps" | "logs")}
            className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3"
          >
            <option value="gps">Registros GPS</option>
            <option value="logs">Logs de consulta</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-clinical-900">Empresa</span>
          <select
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3"
          >
            <option value="">Todas</option>
            {empresas.map((empresa) => (
              <option key={empresa._id} value={empresa._id}>
                {empresa.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="font-medium text-clinical-900">ID turno</span>
          <input
            value={turnoId}
            onChange={(e) => setTurnoId(e.target.value)}
            placeholder="Opcional"
            className="h-10 w-full rounded-lg border border-paper-100 bg-paper-50 px-3 font-data"
          />
        </label>
      </section>

      {loading ? (
        <p className="text-mist-400">Buscando registros…</p>
      ) : registros.length === 0 ? (
        <p className="text-mist-400">No hay registros para los filtros seleccionados.</p>
      ) : (
        <section className="overflow-x-auto rounded-xl bg-white ring-1 ring-paper-100">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-paper-100 text-mist-400">
              <tr>
                <th className="px-4 py-3 font-medium">Turno</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((row) => {
                const id = String(row._id);
                const turno = String(row.turnoId ?? "—");
                const timestamp = row.timestamp
                  ? new Date(String(row.timestamp)).toLocaleString("es-AR")
                  : "—";
                const detalle =
                  tipo === "gps"
                    ? `${row.origen ?? "—"} · ${row.lat ?? "—"}, ${row.lng ?? "—"}`
                    : String(row.evento ?? "—");

                return (
                  <tr key={id} className="border-b border-paper-50">
                    <td className="px-4 py-3 font-data text-xs text-mist-400">{turno}</td>
                    <td className="px-4 py-3 text-clinical-900">{detalle}</td>
                    <td className="px-4 py-3 font-data text-mist-400">{timestamp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
