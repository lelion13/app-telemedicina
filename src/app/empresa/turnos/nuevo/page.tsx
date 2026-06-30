import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NuevoTurnoForm } from "@/components/empresa/nuevo-turno-form";

export default async function NuevoTurnoPage() {
  const session = await auth();
  if (!session?.user || session.user.rol !== "empresa") {
    redirect("/403");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/empresa" className="text-sm text-clinical-700 hover:underline">
          ← Volver a turnos
        </Link>
        <h2 className="mt-2 font-display text-2xl font-semibold text-clinical-900">
          Nuevo turno
        </h2>
      </div>
      <NuevoTurnoForm />
    </div>
  );
}
