import type { Rol } from "@/models/types";

const ROLE_PREFIXES: Record<Rol, string> = {
  admin: "/admin",
  empresa: "/empresa",
  profesional: "/profesional",
};

export function getDashboardForRole(rol: Rol): string {
  return ROLE_PREFIXES[rol];
}

export function canAccessPath(rol: Rol, pathname: string): boolean {
  if (pathname.startsWith("/admin")) {
    return rol === "admin";
  }
  if (pathname.startsWith("/empresa")) {
    return rol === "empresa";
  }
  if (pathname.startsWith("/profesional")) {
    return rol === "profesional";
  }
  return true;
}

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/403") {
    return true;
  }
  if (pathname.startsWith("/consulta/")) {
    return true;
  }
  if (pathname.startsWith("/api/auth") && pathname !== "/api/auth/me") {
    return true;
  }
  return false;
}

export function isProtectedAppPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/empresa") ||
    pathname.startsWith("/profesional")
  );
}

export function isProtectedApiPath(pathname: string): boolean {
  if (pathname === "/api/gps" || pathname === "/api/livekit/token") {
    return false;
  }
  return pathname.startsWith("/api/") && !pathname.startsWith("/api/auth");
}
