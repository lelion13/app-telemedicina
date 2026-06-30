import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Rol } from "@/models/types";

export type AuthSession = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    rol: Rol;
    empresaId?: string;
  };
};

export type RequireAuthResult =
  | { session: AuthSession; error: null }
  | { session: null; error: NextResponse };

export async function requireAuth(
  allowedRoles?: Rol[],
): Promise<RequireAuthResult> {
  const session = await auth();

  if (!session?.user?.id || !session.user.rol) {
    return {
      session: null,
      error: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  const authSession: AuthSession = {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      rol: session.user.rol,
      empresaId: session.user.empresaId,
    },
  };

  if (allowedRoles && !allowedRoles.includes(authSession.user.rol)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Prohibido" }, { status: 403 }),
    };
  }

  return { session: authSession, error: null };
}

export async function requireEmpresaTenant(
  session: AuthSession,
): Promise<RequireAuthResult> {
  if (session.user.rol !== "empresa") {
    return { session: null, error: NextResponse.json({ error: "Prohibido" }, { status: 403 }) };
  }

  if (!session.user.empresaId) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Usuario sin empresa asociada" },
        { status: 403 },
      ),
    };
  }

  return { session, error: null };
}
