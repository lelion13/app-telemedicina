import type { TurnoEstado } from "@/models/types";

const PACIENTE_BLOQUEADOS: TurnoEstado[] = [
  "cancelado",
  "finalizado",
  "ausente",
];

export function canPatientJoinVideo(estado: TurnoEstado): boolean {
  return !PACIENTE_BLOQUEADOS.includes(estado);
}

export function canProfesionalJoinVideo(
  estado: TurnoEstado,
  isAssigned: boolean,
): boolean {
  return (
    isAssigned && (estado === "confirmado" || estado === "en_curso")
  );
}

export function buildParticipantVideoGrant(roomName: string) {
  return {
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    roomRecord: false,
    roomCreate: false,
    roomAdmin: false,
  };
}

export function sanitizeLiveKitTokenResponse(payload: {
  token: string;
  serverUrl: string;
  roomName: string;
}) {
  return {
    token: payload.token,
    serverUrl: payload.serverUrl,
    roomName: payload.roomName,
  };
}
