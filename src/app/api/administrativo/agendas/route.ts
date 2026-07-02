import { NextResponse } from "next/server";
import {
  createAgenda,
  listAgendas,
} from "@/lib/administrativo/agenda-service";
import { requireAuth } from "@/lib/require-auth";
import { agendaInputSchema } from "@/lib/validations/agenda";
import { listAgendasQuerySchema } from "@/lib/validations/administrativo";

export async function GET(request: Request) {
  const authResult = await requireAuth(["administrativo"]);
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const parsed = listAgendasQuerySchema.safeParse({
    activa: searchParams.get("activa") ?? undefined,
    desde: searchParams.get("desde") ?? undefined,
    hasta: searchParams.get("hasta") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Filtros inválidos" }, { status: 400 });
  }

  const agendas = await listAgendas({
    activa: parsed.data.activa,
    desde: parsed.data.desde ? new Date(parsed.data.desde) : undefined,
    hasta: parsed.data.hasta ? new Date(parsed.data.hasta) : undefined,
  });

  return NextResponse.json({ agendas });
}

export async function POST(request: Request) {
  const authResult = await requireAuth(["administrativo"]);
  if (authResult.error) return authResult.error;

  const body = await request.json();
  const parsed = agendaInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const agenda = await createAgenda(authResult.session.user.id, parsed.data);

  return NextResponse.json({ agenda }, { status: 201 });
}
