import type { PatientTokenErrorCode } from "@/lib/turnos/patient-token";

const MENSAJES: Record<PatientTokenErrorCode, { titulo: string; detalle: string }> =
  {
    invalid: {
      titulo: "Link no válido",
      detalle: "El enlace que abriste no corresponde a una consulta activa.",
    },
    expired: {
      titulo: "Link expirado",
      detalle:
        "El tiempo para ingresar a esta consulta ya finalizó. Contactá a tu empresa de salud para obtener un nuevo turno.",
    },
    not_yet_valid: {
      titulo: "Consulta aún no disponible",
      detalle:
        "Tu link se habilitará unos minutos antes del horario programado. Volvé a intentar más cerca de la hora.",
    },
    cancelled: {
      titulo: "Turno cancelado",
      detalle: "Esta consulta fue cancelada. Si necesitás ayuda, contactá a tu empresa.",
    },
    mismatch: {
      titulo: "Link no válido",
      detalle: "Este enlace ya no es válido. Pedí un nuevo mail de confirmación.",
    },
  };

export function ConsultaError({
  code,
  message,
}: {
  code: PatientTokenErrorCode;
  message?: string;
}) {
  const copy = MENSAJES[code];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-8 text-center">
      <p className="font-display text-sm uppercase tracking-wide text-clinical-700">
        Telemedicina Lion
      </p>
      <h1 className="font-display mt-4 text-3xl font-semibold text-clinical-900">
        {copy.titulo}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-clinical-700">
        {message ?? copy.detalle}
      </p>
    </main>
  );
}
