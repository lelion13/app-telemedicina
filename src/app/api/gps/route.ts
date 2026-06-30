import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { registerGpsForTurno } from "@/lib/gps/service";
import { getClientIp, getUserAgent } from "@/lib/request";
import { PatientTokenError } from "@/lib/turnos/patient-token";
import { resolvePatientConsulta } from "@/lib/turnos/patient-consulta";
import { gpsRegistrationSchema } from "@/lib/validations/gps";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parsed = gpsRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de ubicación inválidos" },
      { status: 400 },
    );
  }

  try {
    const consulta = await resolvePatientConsulta(parsed.data.token);
    const { origen } = await registerGpsForTurno({
      turnoId: consulta.turnoId,
      permisoDenegado: parsed.data.permisoDenegado,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      accuracy: parsed.data.accuracy,
      ip: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json({ origen, registrado: true }, { status: 201 });
  } catch (error) {
    if (error instanceof PatientTokenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
