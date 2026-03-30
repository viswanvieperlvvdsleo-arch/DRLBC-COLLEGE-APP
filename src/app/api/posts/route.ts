import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { apiError, getUserOrError, inferMediaType, notifyUsersByPreference, parseCreateRequest, requireTeacherOrError, roleLabel } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const timeLabel = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const viewerId = url.searchParams.get("userId") || "";

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: true,
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: true,
            likes: viewerId
              ? { where: { userId: viewerId }, select: { userId: true } }
              : false,
          },
        },
        likes: viewerId
          ? { where: { userId: viewerId }, select: { userId: true } }
          : false,
      },
      take: 50,
    });

    return NextResponse.json(
      posts.map((p) => ({
        id: p.id,
        author: p.author.username,
        authorId: p.authorId,
        role: roleLabel(p.author.role),
        avatar: p.author.avatarUrl || "/avatar-placeholder.png",
        time: timeLabel(p.createdAt),
        content: p.caption,
        image: p.mediaType === "IMAGE" ? p.mediaUrl ?? undefined : undefined,
        videoUrl: p.mediaType === "VIDEO" ? p.mediaUrl ?? undefined : undefined,
        imageHint: p.mediaType === "IMAGE" ? "campus" : undefined,
        likes: p.likeCount,
        comments: p.comments.map((c) => ({
          id: c.id,
          author: c.author.username,
          authorId: c.authorId,
          avatar: c.author.avatarUrl || "/avatar-placeholder.png",
          text: c.text,
          likes: c.likeCount,
          isLiked: Array.isArray(c.likes) ? c.likes.length > 0 : false,
        })),
        isLiked: Array.isArray(p.likes) ? p.likes.length > 0 : false,
      }))
    );
  } catch (err) {
    console.error("POSTS GET API CRASH:", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { authorId, caption, file } = await parseCreateRequest(req, { allowJson: true });

    if (!authorId) {
      return apiError("Missing authorId", 400);
    }
    if (!caption && !file) {
      return apiError("Post must include text or a file", 400);
    }

    const { user, error } = await getUserOrError(authorId);
    if (error) return error;

    const teacherErr = requireTeacherOrError(user.role, "Only teachers can create feed posts");
    if (teacherErr) return teacherErr;

    let mediaUrl: string | undefined;
    let mediaType: "IMAGE" | "VIDEO" | undefined;

    if (file) {
      const inferred = inferMediaType(file);
      if (!inferred) return apiError("Only image/video uploads are supported", 415);

      const saved = await saveUploadedFile(file, "posts");
      mediaUrl = saved.publicUrl;
      mediaType = inferred;
    }

    const created = await prisma.post.create({
      data: {
        authorId,
        caption: caption || "",
        mediaUrl,
        mediaType,
      },
      include: { author: true },
    });

    await notifyUsersByPreference({
      preferenceKey: "notifyPushPosts",
      actorId: authorId,
      actorName: user.username,
      actorAvatar: user.avatarUrl,
      type: "POST",
      title: "New post",
      description: `${user.username} shared a new post.`,
      link: "/home",
    });

    return NextResponse.json(
      {
        id: created.id,
        author: created.author.username,
        authorId: created.authorId,
        role: roleLabel(created.author.role),
        avatar: created.author.avatarUrl || "/avatar-placeholder.png",
        time: timeLabel(created.createdAt),
        content: created.caption,
        image: created.mediaType === "IMAGE" ? created.mediaUrl ?? undefined : undefined,
        videoUrl: created.mediaType === "VIDEO" ? created.mediaUrl ?? undefined : undefined,
        imageHint: created.mediaType === "IMAGE" ? "campus" : undefined,
        likes: created.likeCount,
        comments: [],
        isLiked: false,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POSTS POST API CRASH:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const idRaw = url.searchParams.get("id") || url.searchParams.get("postId") || "";
    const userId = url.searchParams.get("userId") || url.searchParams.get("authorId") || "";

    const postId = Number(idRaw);
    if (!Number.isFinite(postId) || postId <= 0) {
      return apiError("Missing or invalid post id", 400);
    }
    if (!userId) {
      return apiError("Missing userId", 400);
    }

    // Authorization: only the author can delete their post.
    const result = await prisma.post.deleteMany({
      where: { id: postId, authorId: userId },
    });

    if (result.count === 0) {
      return apiError("Post not found or not allowed", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POSTS DELETE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
