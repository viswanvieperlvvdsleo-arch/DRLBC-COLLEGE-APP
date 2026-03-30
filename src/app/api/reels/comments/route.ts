import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, getUserOrError, notifyUserByPreference } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      reelId?: number;
      authorId?: string;
      text?: string;
    };

    const reelId = Number(body.reelId);
    const authorId = String(body.authorId || "");
    const text = String(body.text || "").trim();

    if (!Number.isFinite(reelId) || reelId <= 0) {
      return apiError("Missing or invalid reelId", 400);
    }
    if (!authorId) {
      return apiError("Missing authorId", 400);
    }
    if (!text) {
      return apiError("Comment text required", 400);
    }

    const { user, error } = await getUserOrError(authorId);
    if (error) return error;

    const reel = await prisma.reel.findUnique({ where: { id: reelId } });
    if (!reel) {
      return apiError("Reel not found", 404);
    }

    const comment = await prisma.reelComment.create({
      data: {
        reelId,
        authorId,
        text,
      },
      include: { author: true },
    });

    if (reel.authorId !== authorId) {
      await notifyUserByPreference({
        userId: reel.authorId,
        preferenceKey: "notifyPushComments",
        actorId: authorId,
        actorName: user.username,
        actorAvatar: user.avatarUrl,
        type: "COMMENT",
        title: "New comment",
        description: `${user.username} commented on your reel.`,
        link: "/reels",
      });
    }

    return NextResponse.json(
      {
        id: comment.id,
        author: comment.author.username,
        authorId: comment.authorId,
        avatar: comment.author.avatarUrl || "/avatar-placeholder.png",
        text: comment.text,
        likes: comment.likeCount,
        isLiked: false,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("REEL COMMENTS POST API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const idRaw = url.searchParams.get("id") || url.searchParams.get("commentId") || "";
    const userId = url.searchParams.get("userId") || "";

    const commentId = Number(idRaw);
    if (!Number.isFinite(commentId) || commentId <= 0) {
      return apiError("Missing or invalid comment id", 400);
    }
    if (!userId) {
      return apiError("Missing userId", 400);
    }

    const comment = await prisma.reelComment.findUnique({
      where: { id: commentId },
      include: { reel: { select: { authorId: true } } },
    });
    if (!comment) {
      return apiError("Comment not found", 404);
    }

    const isReelOwner = comment.reel.authorId === userId;
    const isCommentOwner = comment.authorId === userId;
    if (!isReelOwner && !isCommentOwner) {
      return apiError("Not allowed to delete this comment", 403);
    }

    await prisma.reelComment.delete({ where: { id: commentId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("REEL COMMENTS DELETE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
