import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAuditoria } from "@/lib/admin/queries";
import { auditoriaQuerySchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = auditoriaQuerySchema.safeParse({
    tipo: searchParams.get("tipo") ?? "gps",
    turnoId: searchParams.get("turnoId") ?? undefined,
    empresaId: searchParams.get("empresaId") ?? undefined,
    desde: searchParams.get("desde") ?? undefined,
    hasta: searchParams.get("hasta") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const data = await getAuditoria({
    tipo: parsed.data.tipo,
    turnoId: parsed.data.turnoId,
    empresaId: parsed.data.empresaId,
    desde: parsed.data.desde ? new Date(parsed.data.desde) : undefined,
    hasta: parsed.data.hasta ? new Date(parsed.data.hasta) : undefined,
  });

  return NextResponse.json(data);
}
