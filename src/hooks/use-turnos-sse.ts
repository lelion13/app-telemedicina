"use client";

import { useEffect, useRef } from "react";
import type { TurnoActualizadoClientEvent } from "@/lib/realtime/types";

const MAX_SSE_RETRIES = 5;
const POLL_INTERVAL_MS = 30_000;

type UseTurnosSseOptions = {
  enabled?: boolean;
  onConnected?: () => void;
  onTurnoActualizado: (event: TurnoActualizadoClientEvent) => void;
  onPoll: () => void;
};

function parseTurnoEvent(data: string): TurnoActualizadoClientEvent | null {
  try {
    const parsed = JSON.parse(data) as TurnoActualizadoClientEvent;
    if (parsed.type !== "turno_actualizado" || !parsed.turnoId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function useTurnosSse({
  enabled = true,
  onConnected,
  onTurnoActualizado,
  onPoll,
}: UseTurnosSseOptions) {
  const onTurnoRef = useRef(onTurnoActualizado);
  const onPollRef = useRef(onPoll);
  const onConnectedRef = useRef(onConnected);

  useEffect(() => {
    onTurnoRef.current = onTurnoActualizado;
  }, [onTurnoActualizado]);

  useEffect(() => {
    onPollRef.current = onPoll;
  }, [onPoll]);

  useEffect(() => {
    onConnectedRef.current = onConnected;
  }, [onConnected]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let disposed = false;
    let eventSource: EventSource | null = null;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const clearRetryTimer = () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const startPolling = () => {
      if (pollTimer) {
        return;
      }
      onPollRef.current();
      pollTimer = setInterval(() => {
        onPollRef.current();
      }, POLL_INTERVAL_MS);
    };

    const connect = () => {
      if (disposed) {
        return;
      }

      eventSource?.close();
      eventSource = new EventSource("/api/events/turnos");

      eventSource.addEventListener("turno_actualizado", (message) => {
        const event = parseTurnoEvent(message.data);
        if (event) {
          onTurnoRef.current(event);
        }
      });

      eventSource.onopen = () => {
        retryCount = 0;
        onConnectedRef.current?.();
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;

        if (disposed) {
          return;
        }

        if (retryCount >= MAX_SSE_RETRIES) {
          startPolling();
          return;
        }

        const delay = Math.min(1000 * 2 ** retryCount, 30_000);
        retryCount += 1;
        clearRetryTimer();
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      clearRetryTimer();
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      eventSource?.close();
    };
  }, [enabled]);
}
