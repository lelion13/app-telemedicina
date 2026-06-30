import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function EmpresaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.rol !== "empresa") {
    redirect("/403");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-data text-xs uppercase tracking-widest text-mist-400">
          Empresa
        </p>
        <h1 className="font-display text-3xl font-semibold text-clinical-900">
          Telemedicina Lion
        </h1>
      </header>
      <nav className="mb-6 flex gap-2 border-b border-paper-100 pb-4">
        <Link
          href="/empresa"
          className="rounded-lg px-3 py-2 text-sm font-medium text-clinical-700 hover:bg-paper-100"
        >
          Mis turnos
        </Link>
      </nav>
      {children}
    </div>
  );
}
