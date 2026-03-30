import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { apiError, getUserOrError, inferMediaType, notifyUsersByPreference, parseMultipartRequired, requireTeacherOrError, roleLabel } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const viewerId = url.searchParams.get("userId") || "";

    const reels = await prisma.reel.findMany({
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
      reels.map((r) => ({
        id: r.id,
        author: r.author.username,
        authorId: r.authorId,
        avatar: r.author.avatarUrl || "/avatar-placeholder.png",
        videoUrl: r.videoUrl,
        caption: r.caption ?? "",
        likes: r.likeCount,
        isLiked: Array.isArray(r.likes) ? r.likes.length > 0 : false,
        comments: r.comments.map((c) => ({
          id: c.id,
          author: c.author.username,
          authorId: c.authorId,
          avatar: c.author.avatarUrl || "/avatar-placeholder.png",
          text: c.text,
          likes: c.likeCount,
          isLiked: Array.isArray(c.likes) ? c.likes.length > 0 : false,
        })),
        createdAt: r.createdAt.toISOString(),
        authorRole: roleLabel(r.author.role),
      }))
    );
  } catch (err) {
    console.error("REELS GET API CRASH:", err);
    return NextResponse.json({ error: "Failed to fetch reels" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const parsed = await parseMultipartRequired(req);
    const authorId = parsed.authorId;
    const caption = parsed.caption.trim() ? parsed.caption.trim() : null;
    const file = parsed.file;

    if (!authorId) {
      return apiError("Missing authorId", 400);
    }
    if (!file) {
      return apiError("Missing file", 400);
    }
    const mediaType = inferMediaType(file);
    if (mediaType !== "VIDEO") return apiError("Reels must be a video file", 415);

    const { user, error } = await getUserOrError(authorId);
    if (error) return error;

    const teacherErr = requireTeacherOrError(user.role, "Only teachers can post reels");
    if (teacherErr) return teacherErr;

    const saved = await saveUploadedFile(file, "reels");

    const created = await prisma.reel.create({
      data: {
        authorId,
        caption,
        videoUrl: saved.publicUrl,
      },
      include: { author: true },
    });

    await notifyUsersByPreference({
      preferenceKey: "notifyPushReels",
      actorId: authorId,
      actorName: user.username,
      actorAvatar: user.avatarUrl,
      type: "REEL",
      title: "New reel",
      description: `${user.username} posted a new reel.`,
      link: "/reels",
    });

    return NextResponse.json(
      {
        id: created.id,
        author: created.author.username,
        authorId: created.authorId,
        avatar: created.author.avatarUrl || "/avatar-placeholder.png",
        videoUrl: created.videoUrl,
        caption: created.caption ?? "",
        likes: created.likeCount,
        isLiked: false,
        comments: [],
        createdAt: created.createdAt.toISOString(),
        authorRole: roleLabel(created.author.role),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("REELS POST API CRASH:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const idRaw = url.searchParams.get("id") || url.searchParams.get("reelId") || "";
    const userId = url.searchParams.get("userId") || "";

    const reelId = Number(idRaw);
    if (!Number.isFinite(reelId) || reelId <= 0) {
      return apiError("Missing or invalid reel id", 400);
    }
    if (!userId) {
      return apiError("Missing userId", 400);
    }

    // Authorization: only the author can delete their reel.
    const result = await prisma.reel.deleteMany({
      where: { id: reelId, authorId: userId },
    });

    if (result.count === 0) {
      return apiError("Reel not found or not allowed", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("REELS DELETE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
