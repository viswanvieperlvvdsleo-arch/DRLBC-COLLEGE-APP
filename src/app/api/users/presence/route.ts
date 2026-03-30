import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-utils";
import { publishToAllConnectedUsers } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    let body: Record<string, unknown> = {};
    if (raw.trim().length > 0) {
      try {
        body = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return apiError("Invalid JSON", 400);
      }
    }

    const userId = String(body.userId || "").trim();

    if (!userId) {
      return apiError("Missing userId", 400);
    }

    const result = await prisma.user.updateMany({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });

    if (result.count === 0) {
      return NextResponse.json({ ok: false, reason: "User not found" });
    }

    publishToAllConnectedUsers(
      "presence",
      { userId, isOnline: true },
      { excludeUserIds: [userId] }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PRESENCE POST CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
