import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminMetrics } from "@/lib/admin/queries";
import { metricsQuerySchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = metricsQuerySchema.safeParse({
    desde: searchParams.get("desde") ?? undefined,
    hasta: searchParams.get("hasta") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const metrics = await getAdminMetrics(
    parsed.data.desde ? new Date(parsed.data.desde) : undefined,
    parsed.data.hasta ? new Date(parsed.data.hasta) : undefined,
  );

  return NextResponse.json(metrics);
}
