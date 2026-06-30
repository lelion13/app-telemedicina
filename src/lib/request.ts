import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

export function getClientIp(headersList: ReadonlyHeaders): string | undefined {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }

  return headersList.get("x-real-ip") ?? undefined;
}

export function getUserAgent(headersList: ReadonlyHeaders): string | undefined {
  return headersList.get("user-agent") ?? undefined;
}
