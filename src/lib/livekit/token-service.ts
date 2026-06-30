import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import connectDB from "@/lib/db";
import { logConsultaEvent } from "@/lib/consulta/audit";
import {
  buildParticipantVideoGrant,
  canPatientJoinVideo,
  canProfesionalJoinVideo,
} from "@/lib/livekit/access";
import {
  getLiveKitApiCredentials,
  getLiveKitHttpUrl,
  getLiveKitServerUrl,
} from "@/lib/livekit/config";
import { isAssignedToProfesional } from "@/lib/turnos/state";
import { resolvePatientConsulta } from "@/lib/turnos/patient-consulta";
import { RegistroGPS, Turno } from "@/models";
import type { TurnoEstado } from "@/models/types";

const LIVEKIT_TOKEN_TTL = "2h";

async function ensureRoomExists(roomName: string): Promise<void> {
  const { apiKey, apiSecret } = getLiveKitApiCredentials();
  const roomService = new RoomServiceClient(
    getLiveKitHttpUrl(),
    apiKey,
    apiSecret,
  );

  try {
    await roomService.createRoom({
      name: roomName,
      maxParticipants: 2,
      emptyTimeout: 300,
      departureTimeout: 120,
    });
  } catch {
    // La sala ya existe o LiveKit la creará al unirse el primer participante.
  }
}

async function issueToken(
  roomName: string,
  identity: string,
  name: string,
): Promise<string> {
  const { apiKey, apiSecret } = getLiveKitApiCredentials();
  await ensureRoomExists(roomName);

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    ttl: LIVEKIT_TOKEN_TTL,
  });

  token.addGrant(buildParticipantVideoGrant(roomName));

  return token.toJwt();
}

export async function createPatientLiveKitToken(patientToken: string) {
  const consulta = await resolvePatientConsulta(patientToken);
  await connectDB();

  const gpsCount = await RegistroGPS.countDocuments({
    turnoId: consulta.turnoId,
  });

  if (gpsCount === 0) {
    throw new Error("Completá el flujo de ubicación antes de ingresar");
  }

  if (!canPatientJoinVideo(consulta.estado as TurnoEstado)) {
    throw new Error("Este turno ya no admite ingreso a la videollamada");
  }

  const turno = await Turno.findById(consulta.turnoId).select("salaVideoId");
  if (!turno?.salaVideoId) {
    throw new Error("Sala de videollamada no disponible");
  }

  const jwt = await issueToken(
    turno.salaVideoId,
    `paciente-${consulta.turnoId}`,
    consulta.pacienteNombre || "Paciente",
  );

  await logConsultaEvent(consulta.turnoId, "llamada_iniciada", {
    rol: "paciente",
  });

  return {
    token: jwt,
    serverUrl: getLiveKitServerUrl(),
    roomName: turno.salaVideoId,
    turnoEstado: consulta.estado,
  };
}

export async function createProfesionalLiveKitToken(
  turnoId: string,
  profesionalId: string,
) {
  await connectDB();

  const turno = await Turno.findById(turnoId)
    .populate("pacienteId", "nombre apellido")
    .populate("profesionalId", "nombre apellido");

  if (!turno) {
    return null;
  }

  if (!isAssignedToProfesional(turno, profesionalId)) {
    return null;
  }

  if (!canProfesionalJoinVideo(turno.estado, true)) {
    throw new Error("La consulta no está lista para videollamada");
  }

  const profesional = turno.profesionalId as {
    nombre?: string;
    apellido?: string;
  } | null;
  const displayName = profesional
    ? `${profesional.nombre ?? ""} ${profesional.apellido ?? ""}`.trim()
    : "Profesional";

  const jwt = await issueToken(
    turno.salaVideoId,
    `profesional-${profesionalId}`,
    displayName || "Profesional",
  );

  await logConsultaEvent(turnoId, "llamada_iniciada", {
    rol: "profesional",
  });

  return {
    token: jwt,
    serverUrl: getLiveKitServerUrl(),
    roomName: turno.salaVideoId,
    turnoEstado: turno.estado,
  };
}
