import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TurnosEmpresaPanel } from "@/components/empresa/turnos-panel";

export default async function EmpresaDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "empresa") {
    redirect("/403");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-clinical-900">
            Turnos de tu empresa
          </h2>
          <p className="mt-1 text-sm text-mist-400">Hola, {session.user.name}</p>
        </div>
        <Link
          href="/empresa/turnos/nuevo"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-clinical-700 px-5 text-sm font-medium text-white hover:bg-clinical-900"
        >
          Nuevo turno
        </Link>
      </div>
      <TurnosEmpresaPanel />
    </div>
  );
}
