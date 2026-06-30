import { SignJWT, jwtVerify } from "jose";

function getPatientTokenSecret(): Uint8Array {
  const secret = process.env.PATIENT_TOKEN_SECRET;
  if (!secret) {
    throw new Error("PATIENT_TOKEN_SECRET no está definida");
  }
  return new TextEncoder().encode(secret);
}

function getTokenValidBeforeMin(): number {
  return Number(process.env.TOKEN_VALID_BEFORE_MIN ?? 15);
}

function getTokenValidAfterMin(): number {
  return Number(process.env.TOKEN_VALID_AFTER_MIN ?? 60);
}

export function computeTokenWindow(fechaHoraProgramada: Date): {
  validFrom: Date;
  tokenExpiraEn: Date;
} {
  const beforeMin = getTokenValidBeforeMin();
  const afterMin = getTokenValidAfterMin();

  const validFrom = new Date(fechaHoraProgramada);
  validFrom.setMinutes(validFrom.getMinutes() - beforeMin);

  const tokenExpiraEn = new Date(fechaHoraProgramada);
  tokenExpiraEn.setMinutes(tokenExpiraEn.getMinutes() + afterMin);

  return { validFrom, tokenExpiraEn };
}

export async function createPatientAccessToken(
  turnoId: string,
  tokenExpiraEn: Date,
): Promise<string> {
  return new SignJWT({ turnoId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(turnoId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(tokenExpiraEn.getTime() / 1000))
    .sign(getPatientTokenSecret());
}

export type PatientTokenErrorCode =
  | "invalid"
  | "expired"
  | "not_yet_valid"
  | "cancelled"
  | "mismatch";

export class PatientTokenError extends Error {
  readonly code: PatientTokenErrorCode;

  constructor(message: string, code: PatientTokenErrorCode) {
    super(message);
    this.name = "PatientTokenError";
    this.code = code;
  }
}

export async function verifyPatientAccessToken(
  token: string,
): Promise<{ turnoId: string }> {
  try {
    const { payload } = await jwtVerify(token, getPatientTokenSecret());
    const turnoId =
      (typeof payload.turnoId === "string" ? payload.turnoId : null) ??
      (typeof payload.sub === "string" ? payload.sub : null);

    if (!turnoId) {
      throw new PatientTokenError("El link de consulta no es válido", "invalid");
    }

    return { turnoId };
  } catch (error) {
    if (error instanceof PatientTokenError) {
      throw error;
    }
    throw new PatientTokenError(
      "El link de consulta expiró o no es válido",
      "expired",
    );
  }
}
