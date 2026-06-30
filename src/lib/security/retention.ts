import connectDB from "@/lib/db";
import { LogConsulta, RegistroGPS } from "@/models";

/** Política por defecto: 24 meses (Ley 25.326 — validar con cliente legal). */
export function getAuditRetentionMonths(): number {
  const configured = Number(process.env.AUDIT_RETENTION_MONTHS ?? 24);
  if (!Number.isFinite(configured) || configured < 1) {
    return 24;
  }
  return configured;
}

export function getAuditRetentionCutoffDate(now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - getAuditRetentionMonths());
  return cutoff;
}

export async function purgeExpiredAuditData(now = new Date()): Promise<{
  gpsDeleted: number;
  logsDeleted: number;
  cutoff: string;
}> {
  await connectDB();

  const cutoff = getAuditRetentionCutoffDate(now);

  const [gpsResult, logsResult] = await Promise.all([
    RegistroGPS.deleteMany({ timestamp: { $lt: cutoff } }),
    LogConsulta.deleteMany({ timestamp: { $lt: cutoff } }),
  ]);

  return {
    gpsDeleted: gpsResult.deletedCount ?? 0,
    logsDeleted: logsResult.deletedCount ?? 0,
    cutoff: cutoff.toISOString(),
  };
}
