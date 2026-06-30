import connectDB from "@/lib/db";
import { LogConsulta } from "@/models";
import type { LogEvento } from "@/models/types";

export async function logConsultaEvent(
  turnoId: string,
  evento: LogEvento,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await connectDB();

  await LogConsulta.create({
    turnoId,
    evento,
    metadata,
  });
}
