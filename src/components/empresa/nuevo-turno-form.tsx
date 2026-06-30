"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Franja = {
  diaLabel: string;
  horaInicio: string;
  horaFin: string;
};

const emptyPaciente = {
  nombre: "",
  apellido: "",
  telefono: "",
  email: "",
  domicilio: "",
  descripcion: "",
};

export function NuevoTurnoForm() {
  const router = useRouter();
  const [paciente, setPaciente] = useState(emptyPaciente);
  const [fechaHora, setFechaHora] = useState("");
  const [franjas, setFranjas] = useState<Franja[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/empresa/franjas")
      .then((res) => res.json())
      .then((data) => setFranjas(data.franjas ?? []));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const res = await fetch("/api/empresa/turnos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paciente: {
          ...paciente,
          descripcion: paciente.descripcion || undefined,
        },
        fechaHoraProgramada: new Date(fechaHora).toISOString(),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(
        typeof data.error === "string"
          ? data.error
          : "Revisá los datos del formulario",
      );
      return;
    }

    setSuccess(
      data.mailSent
        ? "Turno creado y mail enviado al paciente."
        : "Turno creado. No se pudo enviar el mail (SMTP no configurado).",
    );

    setTimeout(() => router.push("/empresa"), 1500);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl bg-white p-6 ring-1 ring-paper-100"
    >
      {franjas.length > 0 && (
        <div className="rounded-lg bg-paper-50 p-4 text-sm text-clinical-700">
          <p className="font-medium text-clinical-900">Horarios disponibles</p>
          <ul className="mt-2 space-y-1">
            {franjas.map((f, i) => (
              <li key={`${f.diaLabel}-${f.horaInicio}-${i}`}>
                {f.diaLabel} {f.horaInicio}–{f.horaFin}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-signal-alert">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-signal-verified">
          {success}
        </p>
      )}

      <fieldset className="space-y-4">
        <legend className="font-display text-lg font-semibold text-clinical-900">
          Paciente
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *" value={paciente.nombre} onChange={(v) => setPaciente({ ...paciente, nombre: v })} required />
          <Field label="Apellido *" value={paciente.apellido} onChange={(v) => setPaciente({ ...paciente, apellido: v })} required />
          <Field label="Teléfono *" value={paciente.telefono} onChange={(v) => setPaciente({ ...paciente, telefono: v })} required />
          <Field label="Email *" type="email" value={paciente.email} onChange={(v) => setPaciente({ ...paciente, email: v })} required />
          <Field label="Domicilio *" className="sm:col-span-2" value={paciente.domicilio} onChange={(v) => setPaciente({ ...paciente, domicilio: v })} required />
          <Field label="Descripción (opcional)" className="sm:col-span-2" value={paciente.descripcion} onChange={(v) => setPaciente({ ...paciente, descripcion: v })} />
        </div>
      </fieldset>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-clinical-900">Fecha y hora del turno *</span>
        <input
          type="datetime-local"
          required
          value={fechaHora}
          onChange={(e) => setFechaHora(e.target.value)}
          className="h-11 w-full rounded-lg border border-paper-100 bg-paper-50 px-3 outline-none focus-visible:ring-2 focus-visible:ring-clinical-700"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-lg bg-clinical-700 text-sm font-medium text-white hover:bg-clinical-900 disabled:opacity-60"
      >
        {loading ? "Agendando…" : "Agendar y enviar mail"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 text-sm ${className}`}>
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
