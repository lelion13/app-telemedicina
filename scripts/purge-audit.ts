import "dotenv/config";
import connectDB from "../src/lib/db";
import { purgeExpiredAuditData } from "../src/lib/security/retention";
import { safeWarn } from "../src/lib/security/safe-log";

async function main() {
  await connectDB();
  const result = await purgeExpiredAuditData();
  safeWarn("Purga de auditoría completada", result);
}

main().catch((error) => {
  console.error("Error en purga de auditoría");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
