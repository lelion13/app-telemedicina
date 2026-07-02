import { NextResponse } from "next/server";
import { listEmpresas } from "@/lib/admin/queries";
import { requireAuth } from "@/lib/require-auth";

export async function GET() {
  const authResult = await requireAuth(["administrativo"]);
  if (authResult.error) return authResult.error;

  const empresas = await listEmpresas();
  return NextResponse.json({ empresas });
}
