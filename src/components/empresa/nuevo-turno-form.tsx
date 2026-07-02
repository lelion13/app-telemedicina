"use client";

import { buildSlotDateTime } from "@/lib/agenda/slots";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Agenda = {
  _id: string;
  nombre?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionTurnoMinutos: number;
};

type SlotStatus = {
  hora: string;
  ocupado: boolean;
};

const emptyPaciente = {
  nombre: "",
  apellido: "",
  telefono: "",
  email: "",
  domicilio: "",
  descripcion: "",
};

function formatAgendaLabel(agenda: Agenda) {
  const fecha = new Date(agenda.fecha).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  return `${agenda.nombre || "Agenda"} · ${fecha} · ${agenda.horaInicio}–${agenda.horaFin}`;
}

export function NuevoTurnoForm() {
  const router = useRouter();
  const [paciente, setPaciente] = useState(emptyPaciente);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [agendaId, setAgendaId] = useState("");
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [slotHora, setSlotHora] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [consultaUrl, setConsultaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/empresa/agendas")
      .then((res) => res.json())
      .then((data) => setAgendas(data.agendas ?? []));
  }, []);

  useEffect(() => {
    if (!agendaId) {
      setSlots([]);
      setSlotHora("");
      return;
    }

    setSlotsLoading(true);
    fetch(`/api/empresa/agendas/${agendaId}/slots`)
      .then((res) => res.json())
      .then((data) => {
        setSlots((data.slots ?? []).filter((slot: SlotStatus) => !slot.ocupado));
        setSlotHora("");
      })
      .finally(() => setSlotsLoading(false));
  }, [agendaId]);

  const selectedAgenda = agendas.find((agenda) => agenda._id === agendaId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setConsultaUrl(null);

    if (!selectedAgenda || !slotHora) {
      setError("Seleccioná una agenda y un horario disponible");
      return;
    }

    setLoading(true);

    const fechaHoraProgramada = buildSlotDateTime(
      selectedAgenda.fecha,
      slotHora,
    ).toISOString();

    const res = await fetch("/api/empresa/turnos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agendaId,
        paciente: {
          ...paciente,
          descripcion: paciente.descripcion || undefined,
        },
        fechaHoraProgramada,
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

    if (data.mailSent) {
      setSuccess("Turno creado y mail enviado al paciente.");
      setTimeout(() => router.push("/empresa"), 1500);
      return;
    }

    setSuccess("Turno creado. No se pudo enviar el mail: copiá el link de consulta.");
    setConsultaUrl(data.consultaUrl ?? null);
  }

  async function copyConsultaUrl() {
    if (!consultaUrl) return;
    await navigator.clipboard.writeText(consultaUrl);
    setSuccess("Link de consulta copiado al portapapeles.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl bg-white p-6 ring-1 ring-paper-100"
    >
      {agendas.length === 0 ? (
        <p className="rounded-lg bg-paper-50 p-4 text-sm text-mist-400">
          No hay agendas disponibles. Pedile al equipo administrativo que cree una
          agenda para tu empresa.
        </p>
      ) : (
        <>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-clinical-900">Agenda *</span>
            <select
              required
              value={agendaId}
              onChange={(e) => setAgendaId(e.target.value)}
              className="h-11 w-full rounded-lg border border-paper-100 bg-paper-50 px-3 outline-none focus-visible:ring-2 focus-visible:ring-clinical-700"
            >
              <option value="">Seleccioná una agenda</option>
              {agendas.map((agenda) => (
                <option key={agenda._id} value={agenda._id}>
                  {formatAgendaLabel(agenda)}
                </option>
              ))}
            </select>
          </label>

          {agendaId && (
            <fieldset className="space-y-2 text-sm">
              <legend className="font-medium text-clinical-900">
                Horario disponible *
              </legend>
              {slotsLoading ? (
                <p className="text-mist-400">Cargando horarios…</p>
              ) : slots.length === 0 ? (
                <p className="text-mist-400">
                  No quedan turnos libres en esta agenda.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <label
                      key={slot.hora}
                      className={`inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 font-data text-xs font-medium ring-1 ${
                        slotHora === slot.hora
                          ? "bg-clinical-700 text-white ring-clinical-700"
                          : "bg-paper-50 text-clinical-700 ring-paper-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={slot.hora}
                        checked={slotHora === slot.hora}
                        onChange={() => setSlotHora(slot.hora)}
                        className="sr-only"
                        required
                      />
                      {slot.hora}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          )}
        </>
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
      {consultaUrl && (
        <div className="space-y-2 rounded-lg bg-paper-50 p-4 text-sm">
          <p className="font-medium text-clinical-900">Link de consulta del paciente</p>
          <p className="break-all font-data text-xs text-mist-400">{consultaUrl}</p>
          <button
            type="button"
            onClick={copyConsultaUrl}
            className="rounded-lg bg-clinical-700 px-3 py-2 text-xs font-medium text-white hover:bg-clinical-900"
          >
            Copiar link
          </button>
        </div>
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

      <button
        type="submit"
        disabled={loading || agendas.length === 0}
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
