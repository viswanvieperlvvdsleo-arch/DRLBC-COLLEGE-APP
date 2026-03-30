import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-utils";
import {
  hasActiveRealtimeConnection,
  publishToAllConnectedUsers,
  subscribeUserStream,
  removeUserStream,
} from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const streamHeaders = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId")?.trim() || "";

  if (!userId) {
    return apiError("Missing userId", 400);
  }

  await prisma.user.updateMany({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const connectionId = subscribeUserStream(userId, controller);

      const send = (event: string, payload: unknown) => {
        controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
      };

      send("connected", { ok: true, userId });
      publishToAllConnectedUsers(
        "presence",
        { userId, isOnline: true },
        { excludeUserIds: [userId] }
      );

      const keepAlive = setInterval(() => {
        try {
          send("ping", { ts: Date.now() });
        } catch {
          clearInterval(keepAlive);
        }
      }, 15000);

      const cleanup = () => {
        clearInterval(keepAlive);
        removeUserStream(userId, connectionId);
        if (!hasActiveRealtimeConnection(userId)) {
          publishToAllConnectedUsers(
            "presence",
            { userId, isOnline: false },
            { excludeUserIds: [userId] }
          );
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, { headers: streamHeaders });
}
