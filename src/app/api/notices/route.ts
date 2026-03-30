import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/upload";
import { apiError, getUserOrError, inferMediaType, notifyUsersByPreference, parseMultipartRequired, requireTeacherOrError, roleLabel } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    // Opportunistic cleanup so notices disappear after 3 days without needing a cron job.
    await prisma.notice.deleteMany({ where: { expiresAt: { lt: now } } });

    const notices = await prisma.notice.findMany({
      where: { expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      include: { author: true },
      take: 200,
    });

    return NextResponse.json(
      notices.map((n) => ({
        id: n.id,
        author: n.author.username,
        authorId: n.authorId,
        avatar: n.author.avatarUrl || "/avatar-placeholder.png",
        contentUrl: n.mediaUrl,
        contentHint: n.mediaType === "IMAGE" ? "notice" : "video",
        contentType: n.mediaType,
        caption: n.caption ?? "",
        seen: false,
        createdAt: n.createdAt.toISOString(),
        expiresAt: n.expiresAt.toISOString(),
        authorRole: roleLabel(n.author.role),
      }))
    );
  } catch (err) {
    console.error("NOTICES GET API CRASH:", err);
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
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
    if (!mediaType) return apiError("Only image/video uploads are supported", 415);

    const { user, error } = await getUserOrError(authorId);
    if (error) return error;

    const teacherErr = requireTeacherOrError(user.role, "Only teachers can post notices");
    if (teacherErr) return teacherErr;

    const saved = await saveUploadedFile(file, "notices");

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const created = await prisma.notice.create({
      data: {
        authorId,
        caption,
        mediaUrl: saved.publicUrl,
        mediaType,
        expiresAt,
      },
      include: { author: true },
    });

    await notifyUsersByPreference({
      preferenceKey: "notifyPushNotices",
      actorId: authorId,
      actorName: user.username,
      actorAvatar: user.avatarUrl,
      type: "NOTICE",
      title: "New notice",
      description: `${user.username} posted a new notice.`,
      link: "/home",
    });

    return NextResponse.json(
      {
        id: created.id,
        author: created.author.username,
        authorId: created.authorId,
        avatar: created.author.avatarUrl || "/avatar-placeholder.png",
        contentUrl: created.mediaUrl,
        contentHint: created.mediaType === "IMAGE" ? "notice" : "video",
        contentType: created.mediaType,
        caption: created.caption ?? "",
        seen: false,
        createdAt: created.createdAt.toISOString(),
        expiresAt: created.expiresAt.toISOString(),
        authorRole: roleLabel(created.author.role),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("NOTICES POST API CRASH:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const idRaw = url.searchParams.get("id") || url.searchParams.get("noticeId") || "";
    const userId = url.searchParams.get("userId") || url.searchParams.get("authorId") || "";

    const noticeId = Number(idRaw);
    if (!Number.isFinite(noticeId) || noticeId <= 0) {
      return apiError("Missing or invalid notice id", 400);
    }
    if (!userId) {
      return apiError("Missing userId", 400);
    }

    // Authorization: only the author can delete their notice.
    const result = await prisma.notice.deleteMany({
      where: { id: noticeId, authorId: userId },
    });

    if (result.count === 0) {
      return apiError("Notice not found or not allowed", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("NOTICES DELETE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
