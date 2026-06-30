import connectDB from "@/lib/db";
import {
  PatientTokenError,
  computeTokenWindow,
  verifyPatientAccessToken,
} from "@/lib/turnos/patient-token";
import { RegistroGPS, Turno } from "@/models";
import type { GpsOrigen } from "@/models/types";

export type PatientConsultaData = {
  turnoId: string;
  fechaHoraProgramada: Date;
  estado: string;
  pacienteNombre: string;
  profesionalNombre: string | null;
  gps: {
    origen: GpsOrigen;
    lat?: number;
    lng?: number;
    accuracy?: number;
  } | null;
};

export async function resolvePatientConsulta(
  token: string,
): Promise<PatientConsultaData> {
  const { turnoId } = await verifyPatientAccessToken(token);
  await connectDB();

  const turno = await Turno.findById(turnoId)
    .populate("pacienteId", "nombre apellido")
    .populate("profesionalId", "nombre apellido");

  if (!turno) {
    throw new PatientTokenError("No encontramos tu turno", "invalid");
  }

  if (turno.accessToken !== token) {
    throw new PatientTokenError("El link de consulta no es válido", "mismatch");
  }

  if (turno.estado === "cancelado") {
    throw new PatientTokenError("Este turno fue cancelado", "cancelled");
  }

  const now = new Date();
  const { validFrom } = computeTokenWindow(turno.fechaHoraProgramada);

  if (now < validFrom) {
    throw new PatientTokenError(
      "Tu link se habilitará unos minutos antes del horario programado",
      "not_yet_valid",
    );
  }

  if (now > turno.tokenExpiraEn) {
    throw new PatientTokenError("El link de consulta expiró", "expired");
  }

  const ultimoGps = await RegistroGPS.findOne({ turnoId: turno._id })
    .sort({ timestamp: -1 })
    .lean();

  const paciente = turno.pacienteId as {
    nombre?: string;
    apellido?: string;
  } | null;
  const profesional = turno.profesionalId as {
    nombre?: string;
    apellido?: string;
  } | null;

  return {
    turnoId: turno._id.toString(),
    fechaHoraProgramada: turno.fechaHoraProgramada,
    estado: turno.estado,
    pacienteNombre: paciente
      ? `${paciente.nombre ?? ""} ${paciente.apellido ?? ""}`.trim()
      : "",
    profesionalNombre: profesional
      ? `${profesional.nombre ?? ""} ${profesional.apellido ?? ""}`.trim() ||
        null
      : null,
    gps: ultimoGps
      ? {
          origen: ultimoGps.origen,
          lat: ultimoGps.lat ?? undefined,
          lng: ultimoGps.lng ?? undefined,
          accuracy: ultimoGps.accuracy ?? undefined,
        }
      : null,
  };
}
