import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, context: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await context.params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim() || "";

    if (!chatId || !userId) {
      return apiError("Missing chatId or userId", 400);
    }

    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
      select: { muted: true },
    });

    if (!participant) {
      return apiError("Not allowed", 403);
    }

    return NextResponse.json({ muted: participant.muted });
  } catch (err) {
    console.error("CHAT SETTINGS GET CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await context.params;
    const body = (await req.json()) as Record<string, unknown>;
    const userId = String(body.userId || "").trim();
    const muted = Boolean(body.muted);

    if (!chatId || !userId) {
      return apiError("Missing chatId or userId", 400);
    }

    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
      select: { muted: true },
    });

    if (!participant) {
      return apiError("Not allowed", 403);
    }

    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { muted },
    });

    return NextResponse.json({ muted });
  } catch (err) {
    console.error("CHAT SETTINGS PATCH CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
