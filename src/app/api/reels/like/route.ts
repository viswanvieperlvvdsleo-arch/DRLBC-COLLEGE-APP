import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, getUserOrError, notifyUserByPreference } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      reelId?: number;
      userId?: string;
    };

    const reelId = Number(body.reelId);
    const userId = String(body.userId || "");

    if (!Number.isFinite(reelId) || reelId <= 0) {
      return apiError("Missing or invalid reelId", 400);
    }
    if (!userId) {
      return apiError("Missing userId", 400);
    }

    const { user, error } = await getUserOrError(userId);
    if (error) return error;

    const reel = await prisma.reel.findUnique({ where: { id: reelId } });
    if (!reel) {
      return apiError("Reel not found", 404);
    }

    const likeKey = { reelId_userId: { reelId, userId } };
    const existing = await prisma.reelLike.findUnique({ where: likeKey });

    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        if (existing) {
          await tx.reelLike.delete({ where: likeKey });
          const updated = await tx.reel.update({
            where: { id: reelId },
            data: { likeCount: { decrement: 1 } },
          });
          return { isLiked: false, likeCount: Math.max(0, updated.likeCount), didLike: false };
        }

        await tx.reelLike.create({ data: { reelId, userId } });
        const updated = await tx.reel.update({
          where: { id: reelId },
          data: { likeCount: { increment: 1 } },
        });
        return { isLiked: true, likeCount: updated.likeCount, didLike: true };
      });
    } catch (err: any) {
      // If the like was created concurrently, treat as already liked and toggle it off
      if (err?.code === "P2002") {
        try {
          await prisma.reelLike.delete({ where: likeKey });
          const updated = await prisma.reel.update({
            where: { id: reelId },
            data: { likeCount: { decrement: 1 } },
          });
          result = { isLiked: false, likeCount: Math.max(0, updated.likeCount), didLike: false };
        } catch (inner) {
          console.error("REELS LIKE toggle cleanup failed:", inner);
          return apiError("Internal server error", 500);
        }
      } else {
        console.error("REELS LIKE API CRASH:", err);
        return apiError("Internal server error", 500);
      }
    }

    if (result.didLike && reel.authorId !== userId) {
      await notifyUserByPreference({
        userId: reel.authorId,
        preferenceKey: "notifyPushLikes",
        actorId: userId,
        actorName: user.username,
        actorAvatar: user.avatarUrl,
        type: "LIKE",
        title: "New like",
        description: `${user.username} liked your reel.`,
        link: "/reels",
      });
    }

    return NextResponse.json({ isLiked: result.isLiked, likeCount: result.likeCount });
  } catch (err) {
    console.error("REELS LIKE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
