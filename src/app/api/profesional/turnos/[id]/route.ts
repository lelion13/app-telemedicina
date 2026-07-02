import { NextResponse } from "next/server";
import {
  closeTurno,
  getTurnoForProfesional,
  saveEvolucionForTurno,
  startTurno,
  takeTurno,
} from "@/lib/turnos/profesional-service";
import { TurnoValidationError } from "@/lib/turnos/errors";
import {
  closeTurnoSchema,
  saveEvolucionSchema,
} from "@/lib/validations/profesional";
import { requireAuth } from "@/lib/require-auth";
import { RegistroGPS } from "@/models";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireAuth(["profesional"]);
  if (authResult.error) return authResult.error;

  const { id } = await context.params;
  const turno = await getTurnoForProfesional(id, authResult.session.user.id);

  if (!turno) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }

  const gps = await RegistroGPS.findOne({ turnoId: id })
    .sort({ timestamp: -1 })
    .lean();

  return NextResponse.json({
    turno,
    gps: gps
      ? {
          id: gps._id.toString(),
          origen: gps.origen,
          lat: gps.lat ?? undefined,
          lng: gps.lng ?? undefined,
          accuracy: gps.accuracy ?? undefined,
          timestamp: gps.timestamp,
        }
      : null,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAuth(["profesional"]);
  if (authResult.error) return authResult.error;

  const { id } = await context.params;
  const body = await request.json();

  if (body?.accion === "tomar") {
    try {
      const turno = await takeTurno(id, authResult.session.user.id);
      if (!turno) {
        return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
      }
      return NextResponse.json({ turno });
    } catch (error) {
      if (error instanceof TurnoValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  }

  if (body?.accion === "iniciar") {
    try {
      const turno = await startTurno(id, authResult.session.user.id);
      if (!turno) {
        return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
      }
      return NextResponse.json({ turno });
    } catch (error) {
      if (error instanceof TurnoValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  }

  if (body?.accion === "evolucion") {
    const parsed = saveEvolucionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    try {
      const turno = await saveEvolucionForTurno(
        id,
        authResult.session.user.id,
        parsed.data.evolucion,
      );

      if (!turno) {
        return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
      }

      return NextResponse.json({ turno });
    } catch (error) {
      if (error instanceof TurnoValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  }

  const parsed = closeTurnoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const turno = await closeTurno(
      id,
      authResult.session.user.id,
      parsed.data.estado,
      parsed.data.evolucion,
    );

    if (!turno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ turno });
  } catch (error) {
    if (error instanceof TurnoValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
