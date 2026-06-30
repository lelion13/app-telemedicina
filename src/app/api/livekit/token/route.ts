import { NextResponse } from "next/server";
import { sanitizeLiveKitTokenResponse } from "@/lib/livekit/access";
import { LiveKitConfigError } from "@/lib/livekit/config";
import {
  createPatientLiveKitToken,
  createProfesionalLiveKitToken,
} from "@/lib/livekit/token-service";
import { PatientTokenError } from "@/lib/turnos/patient-token";
import { requireAuth } from "@/lib/require-auth";
import { livekitTokenSchema } from "@/lib/validations/livekit";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parsed = livekitTokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    if (parsed.data.role === "paciente") {
      const result = await createPatientLiveKitToken(parsed.data.patientToken);
      return NextResponse.json({
        ...sanitizeLiveKitTokenResponse(result),
        turnoEstado: result.turnoEstado,
      });
    }

    const authResult = await requireAuth(["profesional"]);
    if (authResult.error) {
      return authResult.error;
    }

    const result = await createProfesionalLiveKitToken(
      parsed.data.turnoId,
      authResult.session.user.id,
    );

    if (!result) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      ...sanitizeLiveKitTokenResponse(result),
      turnoEstado: result.turnoEstado,
    });
  } catch (error) {
    if (error instanceof PatientTokenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof LiveKitConfigError) {
      return NextResponse.json(
        { error: "Videollamada no disponible en este momento" },
        { status: 503 },
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
