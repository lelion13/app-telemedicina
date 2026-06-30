const isProduction = process.env.NODE_ENV === "production";

function liveKitConnectSources(): string {
  const url = process.env.LIVEKIT_URL;
  if (!url) {
    return "wss: ws:";
  }
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "wss: ws:";
  }
}

export function buildContentSecurityPolicy(): string {
  const connectSources = [
    "'self'",
    liveKitConnectSources(),
    "https://*.tile.openstreetmap.org",
  ].join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com",
    "font-src 'self' data:",
    `connect-src ${connectSources}`,
    "media-src 'self' blob:",
  ].join("; ");
}

export function getSecurityHeaders(): { key: string; value: string }[] {
  const headers: { key: string; value: string }[] = [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(self), microphone=(self), geolocation=(self)",
    },
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  ];

  if (isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}

export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const { key, value } of getSecurityHeaders()) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
