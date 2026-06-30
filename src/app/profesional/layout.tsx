import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AgendaProfesionalPanel } from "@/components/profesional/agenda-panel";

export default async function ProfesionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.rol !== "profesional") {
    redirect("/403");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-data text-xs uppercase tracking-widest text-mist-400">
          Profesional
        </p>
        <h1 className="font-display text-3xl font-semibold text-clinical-900">
          Agenda del día
        </h1>
        <p className="mt-1 text-sm text-mist-400">{session.user.name}</p>
      </header>
      {children}
    </div>
  );
}
