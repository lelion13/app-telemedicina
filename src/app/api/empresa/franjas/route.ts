import { NextResponse } from "next/server";
import { requireAuth, requireEmpresaTenant } from "@/lib/require-auth";
import { listAgendasForEmpresa } from "@/lib/empresa/agenda-service";

/** @deprecated Usar GET /api/empresa/agendas */
export async function GET() {
  const authResult = await requireAuth(["empresa"]);
  if (authResult.error) return authResult.error;

  const tenantResult = await requireEmpresaTenant(authResult.session);
  if (tenantResult.error) return tenantResult.error;

  const agendas = await listAgendasForEmpresa(tenantResult.session.user.empresaId!);

  return NextResponse.json({
    deprecated: true,
    message: "Este endpoint fue reemplazado por /api/empresa/agendas",
    agendas,
  });
}
