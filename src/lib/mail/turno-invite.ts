import nodemailer from "nodemailer";
import { safeWarn } from "@/lib/security/safe-log";

export function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export type TurnoInviteEmail = {
  pacienteNombre: string;
  fechaHora: Date;
  consultaUrl: string;
};

export function buildTurnoInviteEmail({
  pacienteNombre,
  fechaHora,
  consultaUrl,
}: TurnoInviteEmail): { subject: string; text: string; html: string } {
  const fechaFormateada = fechaHora.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "full",
    timeStyle: "short",
  });

  const subject = `Tu consulta de teleasistencia — ${fechaHora.toLocaleDateString("es-AR")}`;

  const text = `Hola ${pacienteNombre},

Tenés una consulta de teleasistencia programada para ${fechaFormateada}.

Ingresá desde este link único:
${consultaUrl}

Al ingresar, el sistema te pedirá autorizar el acceso a tu ubicación para verificar la asistencia. Podés continuar aunque no compartas la ubicación.

Este link es personal. No lo reenvíes a otras personas.

Telemedicina Lion`;

  const html = `
    <p>Hola <strong>${pacienteNombre}</strong>,</p>
    <p>Tenés una consulta de teleasistencia programada para <strong>${fechaFormateada}</strong>.</p>
    <p><a href="${consultaUrl}">Ingresar a la consulta</a></p>
    <p>Al ingresar, te pediremos autorizar el acceso a tu ubicación para verificar la asistencia. Podés continuar aunque no la compartas.</p>
    <p><small>Este link es personal. No lo reenvíes.</small></p>
    <p>Telemedicina Lion</p>
  `;

  return { subject, text, html };
}

export async function sendTurnoInviteEmail(
  to: string,
  payload: TurnoInviteEmail,
): Promise<boolean> {
  const transporter = getMailTransporter();
  if (!transporter) {
    safeWarn("SMTP no configurado: mail de turno no enviado");
    return false;
  }

  const from = process.env.SMTP_FROM ?? "Telemedicina Lion <noreply@localhost>";
  const { subject, text, html } = buildTurnoInviteEmail(payload);

  await transporter.sendMail({ from, to, subject, text, html });
  return true;
}
