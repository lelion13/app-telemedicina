import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-paper-50 px-6 py-16 text-center">
      <p className="font-data text-sm uppercase tracking-widest text-mist-400">403</p>
      <h1 className="mt-4 font-display text-3xl font-semibold text-clinical-900">
        Acceso no permitido
      </h1>
      <p className="mt-3 max-w-md text-clinical-700/80">
        No tenés permisos para ver esta sección. Si creés que es un error, contactá al
        administrador.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex h-11 items-center rounded-lg bg-clinical-700 px-6 text-sm font-medium text-white hover:bg-clinical-900"
      >
        Volver al login
      </Link>
    </div>
  );
}
