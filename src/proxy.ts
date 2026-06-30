import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  canAccessPath,
  getDashboardForRole,
  isProtectedApiPath,
  isProtectedAppPath,
  isPublicPath,
} from "@/lib/authz";
import { canAccessApiPath } from "@/lib/admin/metrics";
import { getClientIp } from "@/lib/request";
import { getSecurityHeaders } from "@/lib/security/headers";
import {
  checkRateLimit,
  RATE_LIMITS,
  type RateLimitResult,
} from "@/lib/security/rate-limit";

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const { key, value } of getSecurityHeaders()) {
    response.headers.set(key, value);
  }
  return response;
}

function rateLimitResponse(
  result: Extract<RateLimitResult, { allowed: false }>,
): NextResponse {
  const response = NextResponse.json(
    { error: "Demasiados intentos. Probá de nuevo más tarde." },
    { status: 429 },
  );

  response.headers.set("Retry-After", String(result.retryAfterSeconds));
  return withSecurityHeaders(response);
}

function enforceRateLimit(
  request: NextRequest,
  bucket: string,
  config: { windowMs: number; maxRequests: number },
): NextResponse | null {
  const ip = getClientIp(request.headers) ?? "unknown";
  const result = checkRateLimit(`${bucket}:${ip}`, config);

  if (!result.allowed) {
    return rateLimitResponse(result);
  }

  return null;
}

function isLoginAttempt(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  return (
    pathname === "/login" ||
    (request.method === "POST" &&
      pathname.startsWith("/api/auth") &&
      !pathname.includes("signout"))
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (isLoginAttempt(request)) {
    const limited = enforceRateLimit(request, "login", RATE_LIMITS.login);
    if (limited) return limited;
  }

  if (pathname.startsWith("/consulta/")) {
    const limited = enforceRateLimit(request, "consulta", RATE_LIMITS.consulta);
    if (limited) return limited;
  }

  if (
    (pathname === "/api/gps" || pathname === "/api/livekit/token") &&
    request.method === "POST"
  ) {
    const limited = enforceRateLimit(
      request,
      "patient-api",
      RATE_LIMITS.patientApi,
    );
    if (limited) return limited;
  }

  if (pathname === "/login") {
    const session = await auth();
    if (session?.user?.rol) {
      return withSecurityHeaders(
        NextResponse.redirect(
          new URL(getDashboardForRole(session.user.rol), request.url),
        ),
      );
    }
    return withSecurityHeaders(NextResponse.next());
  }

  if (isPublicPath(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const session = await auth();

  if (!session?.user?.rol) {
    if (isProtectedApiPath(pathname)) {
      return withSecurityHeaders(
        NextResponse.json({ error: "No autorizado" }, { status: 401 }),
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  const rol = session.user.rol;

  if (isProtectedApiPath(pathname) && !canAccessApiPath(rol, pathname)) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Prohibido" }, { status: 403 }),
    );
  }

  if (isProtectedAppPath(pathname) && !canAccessPath(rol, pathname)) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/403", request.url)));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
