"use client";

import {
  DisconnectButton,
  LiveKitRoom,
  RoomAudioRenderer,
  TrackToggle,
  VideoTrack,
  isTrackReference,
  useRemoteParticipants,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import type { TrackReference } from "@livekit/components-react";
import { useCallback, useState } from "react";

type LiveKitCredentials = {
  token: string;
  serverUrl: string;
  roomName: string;
};

type VideoCallShellProps = {
  credentials: LiveKitCredentials | null;
  loading: boolean;
  error: string | null;
  onReconnect: () => void;
  waitingMessage?: string;
  children?: React.ReactNode;
};

export function VideoCallShell({
  credentials,
  loading,
  error,
  onReconnect,
  waitingMessage,
  children,
}: VideoCallShellProps) {
  const [connected, setConnected] = useState(false);
  const [disconnected, setDisconnected] = useState(false);

  const handleDisconnected = useCallback(() => {
    setConnected(false);
    setDisconnected(true);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-clinical-900 text-white/80">
        Conectando videollamada…
      </div>
    );
  }

  if (error || !credentials) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl bg-clinical-900 p-6 text-center text-white">
        <p>{error ?? "No pudimos iniciar la videollamada"}</p>
        <button
          type="button"
          onClick={onReconnect}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-clinical-900"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (disconnected) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl bg-clinical-900 p-6 text-center text-white">
        <p>Te desconectaste de la videollamada.</p>
        <button
          type="button"
          onClick={() => {
            setDisconnected(false);
            onReconnect();
          }}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-clinical-900"
        >
          Volver a conectar
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={credentials.serverUrl}
      token={credentials.token}
      connect
      audio
      video
      onConnected={() => setConnected(true)}
      onDisconnected={handleDisconnected}
      className="overflow-hidden rounded-xl bg-clinical-900"
    >
      <RoomAudioRenderer />
      {children ?? (
        <DefaultVideoLayout
          connected={connected}
          waitingMessage={waitingMessage}
        />
      )}
    </LiveKitRoom>
  );
}

function DefaultVideoLayout({
  connected,
  waitingMessage,
}: {
  connected: boolean;
  waitingMessage?: string;
}) {
  const remoteParticipants = useRemoteParticipants();
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: false }],
    { onlySubscribed: false },
  );
  const remoteCamera = tracks.reduce<TrackReference | undefined>(
    (found, track) => {
      if (found) return found;
      if (
        isTrackReference(track) &&
        remoteParticipants.some((p) => p.identity === track.participant.identity)
      ) {
        return track;
      }
      return undefined;
    },
    undefined,
  );

  return (
    <div className="relative flex min-h-[320px] flex-col">
      <div className="relative flex-1 bg-clinical-900">
        {remoteCamera ? (
          <VideoTrack
            trackRef={remoteCamera}
            className="h-full min-h-[280px] w-full object-cover"
          />
        ) : (
          <div className="flex h-full min-h-[280px] items-center justify-center px-6 text-center text-white/80">
            {connected
              ? (waitingMessage ??
                "Esperando que se una el otro participante…")
              : "Conectando…"}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-white/10 bg-clinical-900/95 p-4">
        <TrackToggle
          source={Track.Source.Microphone}
          className="min-h-12 min-w-12 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
        />
        <TrackToggle
          source={Track.Source.Camera}
          className="min-h-12 min-w-12 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
        />
        <DisconnectButton className="min-h-12 rounded-full bg-signal-alert px-4 py-2 text-sm font-medium text-white">
          Salir
        </DisconnectButton>
      </div>
    </div>
  );
}

export function useLiveKitCredentials(
  fetchCredentials: () => Promise<LiveKitCredentials | null>,
) {
  const [credentials, setCredentials] = useState<LiveKitCredentials | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCredentials();
      if (!result) {
        setError("No pudimos obtener acceso a la sala");
        setCredentials(null);
      } else {
        setCredentials(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setCredentials(null);
    } finally {
      setLoading(false);
    }
  }, [fetchCredentials]);

  return { credentials, loading, error, load, setCredentials };
}

export type { LiveKitCredentials };
