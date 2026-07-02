"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/administrativo", label: "Inicio" },
  { href: "/administrativo/agendas", label: "Agendas" },
  { href: "/administrativo/turnos", label: "Turnos" },
];

export function AdministrativoNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-paper-100 pb-4">
      {links.map((link) => {
        const active =
          link.href === "/administrativo"
            ? pathname === "/administrativo"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-clinical-700 text-white"
                : "text-clinical-700 hover:bg-paper-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
