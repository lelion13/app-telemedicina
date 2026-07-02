import { NextResponse } from "next/server";
import { getAgendaSlotsForEmpresa } from "@/lib/empresa/agenda-service";
import { TurnoValidationError } from "@/lib/turnos/errors";
import { requireAuth, requireEmpresaTenant } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireAuth(["empresa"]);
  if (authResult.error) return authResult.error;

  const tenantResult = await requireEmpresaTenant(authResult.session);
  if (tenantResult.error) return tenantResult.error;

  const { id } = await context.params;

  try {
    const result = await getAgendaSlotsForEmpresa(
      tenantResult.session.user.empresaId!,
      id,
    );

    if (!result) {
      return NextResponse.json({ error: "Agenda no encontrada" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TurnoValidationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
