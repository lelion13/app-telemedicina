import { NextResponse } from "next/server";
import {
  cancelTurnoForEmpresa,
  TurnoValidationError,
} from "@/lib/turnos/service";
import { requireAuth, requireEmpresaTenant } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  const authResult = await requireAuth(["empresa"]);
  if (authResult.error) return authResult.error;

  const tenantResult = await requireEmpresaTenant(authResult.session);
  if (tenantResult.error) return tenantResult.error;

  const { id } = await context.params;

  try {
    const turno = await cancelTurnoForEmpresa(
      id,
      tenantResult.session.user.empresaId!,
    );

    if (!turno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ turno });
  } catch (error) {
    if (error instanceof TurnoValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
