import type { Rol } from "@/models/types";

export function calculateAusentismoRate(
  finalizados: number,
  ausentes: number,
): number {
  const total = finalizados + ausentes;
  if (total === 0) {
    return 0;
  }
  return Math.round((ausentes / total) * 10000) / 100;
}

export function canAccessApiPath(rol: Rol, pathname: string): boolean {
  if (pathname.startsWith("/api/events")) {
    return rol === "empresa";
  }
  if (pathname.startsWith("/api/admin")) {
    return rol === "admin";
  }
  if (pathname.startsWith("/api/empresa")) {
    return rol === "empresa";
  }
  if (pathname.startsWith("/api/profesional")) {
    return rol === "profesional";
  }
  return true;
}
