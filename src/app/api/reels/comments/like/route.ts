import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, getUserOrError } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      commentId?: number;
      userId?: string;
    };

    const commentId = Number(body.commentId);
    const userId = String(body.userId || "");

    if (!Number.isFinite(commentId) || commentId <= 0) {
      return apiError("Missing or invalid commentId", 400);
    }
    if (!userId) {
      return apiError("Missing userId", 400);
    }

    const { error } = await getUserOrError(userId);
    if (error) return error;

    const comment = await prisma.reelComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return apiError("Comment not found", 404);
    }

    const likeKey = { commentId_userId: { commentId, userId } };
    const existing = await prisma.reelCommentLike.findUnique({ where: likeKey });

    const result = await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.reelCommentLike.delete({ where: likeKey });
        const updated = await tx.reelComment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
        });
        return { isLiked: false, likeCount: Math.max(0, updated.likeCount) };
      }

      await tx.reelCommentLike.create({ data: { commentId, userId } });
      const updated = await tx.reelComment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
      });
      return { isLiked: true, likeCount: updated.likeCount };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("REEL COMMENTS LIKE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

