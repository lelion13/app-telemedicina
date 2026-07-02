import { NextResponse } from "next/server";
import { listAdministrativoTurnos } from "@/lib/administrativo/turno-service";
import { requireAuth } from "@/lib/require-auth";
import { administrativoTurnosQuerySchema } from "@/lib/validations/administrativo";

export async function GET(request: Request) {
  const authResult = await requireAuth(["administrativo"]);
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const parsed = administrativoTurnosQuerySchema.safeParse({
    agendaId: searchParams.get("agendaId") ?? undefined,
    estado: searchParams.get("estado") ?? undefined,
    desde: searchParams.get("desde") ?? undefined,
    hasta: searchParams.get("hasta") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Filtros inválidos" }, { status: 400 });
  }

  const turnos = await listAdministrativoTurnos({
    agendaId: parsed.data.agendaId,
    estado: parsed.data.estado,
    desde: parsed.data.desde ? new Date(parsed.data.desde) : undefined,
    hasta: parsed.data.hasta ? new Date(parsed.data.hasta) : undefined,
  });

  return NextResponse.json({ turnos });
}
