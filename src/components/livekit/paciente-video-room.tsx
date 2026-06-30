"use client";

import { useCallback, useEffect } from "react";
import {
  useLiveKitCredentials,
  VideoCallShell,
} from "@/components/livekit/video-call-shell";

type PacienteVideoRoomProps = {
  patientToken: string;
  turnoEstado?: string;
};

export function PacienteVideoRoom({
  patientToken,
  turnoEstado,
}: PacienteVideoRoomProps) {
  const fetchCredentials = useCallback(async () => {
    const res = await fetch("/api/livekit/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "paciente", patientToken }),
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
  }, [patientToken]);

  const { credentials, loading, error, load } =
    useLiveKitCredentials(fetchCredentials);

  useEffect(() => {
    void load();
  }, [load]);

  const waitingMessage =
    turnoEstado === "pendiente" || turnoEstado === "confirmado"
      ? "Esperando que el profesional inicie la consulta…"
      : "Esperando al profesional en la sala…";

  return (
    <VideoCallShell
      credentials={credentials}
      loading={loading}
      error={error}
      onReconnect={() => void load()}
      waitingMessage={waitingMessage}
    />
  );
}
