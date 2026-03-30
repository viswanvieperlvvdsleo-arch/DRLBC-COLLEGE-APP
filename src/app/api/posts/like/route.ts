import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, getUserOrError, notifyUserByPreference } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      postId?: number;
      userId?: string;
    };

    const postId = Number(body.postId);
    const userId = String(body.userId || "");

    if (!Number.isFinite(postId) || postId <= 0) {
      return apiError("Missing or invalid postId", 400);
    }
    if (!userId) {
      return apiError("Missing userId", 400);
    }

    const { user, error } = await getUserOrError(userId);
    if (error) return error;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return apiError("Post not found", 404);
    }

    const likeKey = { postId_userId: { postId, userId } };

    const existing = await prisma.postLike.findUnique({ where: likeKey });

    const result = await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.postLike.delete({ where: likeKey });
        const updated = await tx.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        });
        return { isLiked: false, likeCount: Math.max(0, updated.likeCount), didLike: false };
      }

      await tx.postLike.create({ data: { postId, userId } });
      const updated = await tx.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      });
      return { isLiked: true, likeCount: updated.likeCount, didLike: true };
    });

    if (result.didLike && post.authorId !== userId) {
      await notifyUserByPreference({
        userId: post.authorId,
        preferenceKey: "notifyPushLikes",
        actorId: userId,
        actorName: user.username,
        actorAvatar: user.avatarUrl,
        type: "LIKE",
        title: "New like",
        description: `${user.username} liked your post.`,
        link: "/home",
      });
    }

    return NextResponse.json({ isLiked: result.isLiked, likeCount: result.likeCount });
  } catch (err) {
    console.error("POSTS LIKE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
