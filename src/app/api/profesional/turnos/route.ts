import { NextResponse } from "next/server";
import { listTurnosForProfesional } from "@/lib/turnos/profesional-service";
import { listProfesionalTurnosSchema } from "@/lib/validations/profesional";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: Request) {
  const authResult = await requireAuth(["profesional"]);
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const parsed = listProfesionalTurnosSchema.safeParse({
    estado: searchParams.get("estado") ?? undefined,
    empresaId: searchParams.get("empresaId") ?? undefined,
    soloHoy: searchParams.get("soloHoy") ?? "true",
    desde: searchParams.get("desde") ?? undefined,
    hasta: searchParams.get("hasta") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Filtros inválidos" }, { status: 400 });
  }

  const turnos = await listTurnosForProfesional({
    estado: parsed.data.estado,
    empresaId: parsed.data.empresaId,
    soloHoy: parsed.data.soloHoy,
    desde: parsed.data.desde ? new Date(parsed.data.desde) : undefined,
    hasta: parsed.data.hasta ? new Date(parsed.data.hasta) : undefined,
  });

  const profesionalId = authResult.session.user.id;
  const turnosConAcciones = turnos.map((turno) => ({
    ...turno,
    acciones: {
      puedeTomar:
        !turno.profesionalId &&
        (turno.estado === "pendiente" || turno.estado === "confirmado"),
      puedeAtender:
        !!turno.profesionalId &&
        turno.profesionalId.toString() === profesionalId &&
        ["pendiente", "confirmado", "en_curso"].includes(turno.estado),
    },
  }));

  return NextResponse.json({ turnos: turnosConAcciones });
}
