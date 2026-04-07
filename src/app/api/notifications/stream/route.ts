import { auth } from "@/lib/auth";
import { addSubscriber, removeSubscriber } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;
  let keepAliveTimer: NodeJS.Timeout;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
      addSubscriber(userId, controller);

      // Initial ping
      ctrl.enqueue(encoder.encode(": connected\n\n"));

      // Keepalive every 25s to prevent proxy/browser timeouts
      keepAliveTimer = setInterval(() => {
        try {
          ctrl.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(keepAliveTimer);
        }
      }, 25000);
    },
    cancel() {
      clearInterval(keepAliveTimer);
      removeSubscriber(userId, controller);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
