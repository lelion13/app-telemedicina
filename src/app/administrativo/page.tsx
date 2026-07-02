import Link from "next/link";

export default function AdministrativoHomePage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href="/administrativo/agendas"
        className="rounded-2xl bg-white p-6 ring-1 ring-paper-100 transition hover:ring-clinical-700/20"
      >
        <h2 className="font-display text-xl font-semibold text-clinical-900">
          Agendas
        </h2>
        <p className="mt-2 text-sm text-mist-400">
          Creá días con horarios y duración fija por turno. Asigná empresas o
          dejá la agenda abierta a todas.
        </p>
      </Link>
      <Link
        href="/administrativo/turnos"
        className="rounded-2xl bg-white p-6 ring-1 ring-paper-100 transition hover:ring-clinical-700/20"
      >
        <h2 className="font-display text-xl font-semibold text-clinical-900">
          Monitor de turnos
        </h2>
        <p className="mt-2 text-sm text-mist-400">
          Supervisá todos los turnos de todas las empresas y profesionales,
          filtrando por agenda o estado.
        </p>
      </Link>
    </div>
  );
}
