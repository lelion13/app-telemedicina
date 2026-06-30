import { requireAuth } from "@/lib/require-auth";

export async function requireAdmin() {
  return requireAuth(["admin"]);
}
