"use client";

import { useCallback, useEffect } from "react";
import {
  useLiveKitCredentials,
  VideoCallShell,
} from "@/components/livekit/video-call-shell";

type ProfesionalVideoRoomProps = {
  turnoId: string;
  enabled: boolean;
};

export function ProfesionalVideoRoom({
  turnoId,
  enabled,
}: ProfesionalVideoRoomProps) {
  const fetchCredentials = useCallback(async () => {
    const res = await fetch("/api/livekit/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "profesional", turnoId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "No pudimos ingresar a la videollamada");
    }

    const data = await res.json();
    return {
      token: data.token as string,
      serverUrl: data.serverUrl as string,
      roomName: data.roomName as string,
    };
  }, [turnoId]);

  const { credentials, loading, error, load } =
    useLiveKitCredentials(fetchCredentials);

  useEffect(() => {
    if (enabled) {
      void load();
    }
  }, [enabled, load]);

  if (!enabled) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl bg-clinical-900 p-8 text-center text-white">
        <p className="text-sm text-white/70">Sala de videollamada</p>
        <p className="mt-2 text-lg">Iniciá la consulta para habilitar el video</p>
      </div>
    );
  }

  return (
    <VideoCallShell
      credentials={credentials}
      loading={loading}
      error={error}
      onReconnect={() => void load()}
      waitingMessage="Esperando que el paciente se una a la sala…"
    />
  );
}
