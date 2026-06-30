import { subscribeTurnoEvents } from "@/lib/realtime/turno-events";
import { toClientEvent } from "@/lib/realtime/types";
import { requireAuth, requireEmpresaTenant } from "@/lib/require-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEARTBEAT_MS = 30_000;

export async function GET(request: Request) {
  const authResult = await requireAuth(["empresa"]);
  if (authResult.error) {
    return authResult.error;
  }

  const tenantResult = await requireEmpresaTenant(authResult.session);
  if (tenantResult.error) {
    return tenantResult.error;
  }

  const empresaId = tenantResult.session.user.empresaId!;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(data));
      };

      send("event: connected\ndata: {}\n\n");

      const unsubscribe = subscribeTurnoEvents(empresaId, (event) => {
        const payload = JSON.stringify(toClientEvent(event));
        send(`event: turno_actualizado\ndata: ${payload}\n\n`);
      });

      const heartbeat = setInterval(() => {
        send(": heartbeat\n\n");
      }, HEARTBEAT_MS);

      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // El stream ya estaba cerrado.
        }
      };

      request.signal.addEventListener("abort", close);
    },
    cancel() {
      // cleanup handled by abort listener
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
