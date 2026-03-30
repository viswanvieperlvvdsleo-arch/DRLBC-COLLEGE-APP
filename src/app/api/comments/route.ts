import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, getUserOrError, notifyUserByPreference } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      postId?: number;
      authorId?: string;
      text?: string;
    };

    const postId = Number(body.postId);
    const authorId = String(body.authorId || "");
    const text = String(body.text || "").trim();

    if (!Number.isFinite(postId) || postId <= 0) {
      return apiError("Missing or invalid postId", 400);
    }
    if (!authorId) {
      return apiError("Missing authorId", 400);
    }
    if (!text) {
      return apiError("Comment text required", 400);
    }

    const { user, error } = await getUserOrError(authorId);
    if (error) return error;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return apiError("Post not found", 404);
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId,
        text,
      },
      include: { author: true },
    });

    if (post.authorId !== authorId) {
      await notifyUserByPreference({
        userId: post.authorId,
        preferenceKey: "notifyPushComments",
        actorId: authorId,
        actorName: user.username,
        actorAvatar: user.avatarUrl,
        type: "COMMENT",
        title: "New comment",
        description: `${user.username} commented on your post.`,
        link: "/home",
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
    console.error("COMMENTS POST API CRASH:", err);
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

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { select: { authorId: true } } },
    });
    if (!comment) {
      return apiError("Comment not found", 404);
    }

    const isPostOwner = comment.post.authorId === userId;
    const isCommentOwner = comment.authorId === userId;
    if (!isPostOwner && !isCommentOwner) {
      return apiError("Not allowed to delete this comment", 403);
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("COMMENTS DELETE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
