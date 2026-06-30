export class LiveKitConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveKitConfigError";
  }
}

export function getLiveKitServerUrl(): string {
  const serverUrl = process.env.LIVEKIT_URL;
  if (!serverUrl) {
    throw new LiveKitConfigError("LIVEKIT_URL no está definida");
  }
  return serverUrl;
}

export function getLiveKitHttpUrl(serverUrl = getLiveKitServerUrl()): string {
  return serverUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
}

export function getLiveKitApiCredentials(): { apiKey: string; apiSecret: string } {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new LiveKitConfigError(
      "LIVEKIT_API_KEY o LIVEKIT_API_SECRET no están definidas",
    );
  }

  return { apiKey, apiSecret };
}
