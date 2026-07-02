import { auth } from "@/auth";
import { AdministrativoNav } from "@/components/administrativo/administrativo-nav";
import { redirect } from "next/navigation";

export default async function AdministrativoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.rol !== "administrativo") {
    redirect("/403");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-data text-xs uppercase tracking-widest text-mist-400">
          Administrativo
        </p>
        <h1 className="font-display text-3xl font-semibold text-clinical-900">
          Coordinación de agendas
        </h1>
        <p className="mt-1 text-sm text-mist-400">{session.user.name}</p>
      </header>
      <AdministrativoNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
