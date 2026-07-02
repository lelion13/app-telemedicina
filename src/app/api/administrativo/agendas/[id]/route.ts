import { NextResponse } from "next/server";
import { updateAgenda } from "@/lib/administrativo/agenda-service";
import { requireAuth } from "@/lib/require-auth";
import { agendaUpdateSchema } from "@/lib/validations/agenda";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAuth(["administrativo"]);
  if (authResult.error) return authResult.error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = agendaUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const agenda = await updateAgenda(id, parsed.data);

  if (!agenda) {
    return NextResponse.json({ error: "Agenda no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ agenda });
}
