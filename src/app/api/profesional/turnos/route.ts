import { NextResponse } from "next/server";
import { listTurnosForProfesional } from "@/lib/turnos/profesional-service";
import { listProfesionalTurnosSchema } from "@/lib/validations/profesional";
import { requireAuth } from "@/lib/require-auth";
import { extractDocumentId } from "@/lib/mongoose/ref-id";

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
  const turnosConAcciones = turnos.map((turno) => {
    const turnoProfesionalId = extractDocumentId(
      turno.profesionalId as string | { _id?: { toString(): string } } | null,
    );
    const asignadoAMi = turnoProfesionalId === profesionalId;

    return {
      ...turno,
      acciones: {
        puedeTomar:
          !turnoProfesionalId &&
          (turno.estado === "pendiente" || turno.estado === "confirmado"),
        puedeAtender:
          asignadoAMi &&
          (turno.estado === "pendiente" ||
            turno.estado === "confirmado" ||
            turno.estado === "en_curso"),
      },
    };
  });

  return NextResponse.json({ turnos: turnosConAcciones });
}
