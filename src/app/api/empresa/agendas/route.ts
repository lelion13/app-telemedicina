import { NextResponse } from "next/server";
import { listAgendasForEmpresa } from "@/lib/empresa/agenda-service";
import { requireAuth, requireEmpresaTenant } from "@/lib/require-auth";

export async function GET() {
  const authResult = await requireAuth(["empresa"]);
  if (authResult.error) return authResult.error;

  const tenantResult = await requireEmpresaTenant(authResult.session);
  if (tenantResult.error) return tenantResult.error;

  const agendas = await listAgendasForEmpresa(tenantResult.session.user.empresaId!);
  return NextResponse.json({ agendas });
}
