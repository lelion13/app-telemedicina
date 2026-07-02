import { NextResponse } from "next/server";
import { getAgendaSlots } from "@/lib/administrativo/agenda-service";
import { requireAuth } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireAuth(["administrativo"]);
  if (authResult.error) return authResult.error;

  const { id } = await context.params;
  const result = await getAgendaSlots(id);

  if (!result) {
    return NextResponse.json({ error: "Agenda no encontrada" }, { status: 404 });
  }

  return NextResponse.json(result);
}
