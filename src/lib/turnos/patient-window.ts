import { computeTokenWindow } from "@/lib/turnos/patient-token";

export type PatientLinkWindowStatus = "before_window" | "in_window" | "expired";

export type PatientLinkWindow = {
  status: PatientLinkWindowStatus;
  validFrom: Date;
  tokenExpiraEn: Date;
};

export function getPatientLinkWindow(
  fechaHoraProgramada: Date,
  tokenExpiraEn: Date,
  now: Date = new Date(),
): PatientLinkWindow {
  const { validFrom } = computeTokenWindow(fechaHoraProgramada);

  let status: PatientLinkWindowStatus = "in_window";
  if (now < validFrom) {
    status = "before_window";
  } else if (now > tokenExpiraEn) {
    status = "expired";
  }

  return { status, validFrom, tokenExpiraEn };
}

export function patientLinkWindowLabel(window: PatientLinkWindow): string {
  const format = (date: Date) =>
    date.toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Argentina/Buenos_Aires",
    });

  switch (window.status) {
    case "before_window":
      return `El paciente podrá ingresar desde ${format(window.validFrom)}`;
    case "expired":
      return `El link del paciente expiró el ${format(window.tokenExpiraEn)}`;
    default:
      return `El paciente puede ingresar hasta ${format(window.tokenExpiraEn)}`;
  }
}
