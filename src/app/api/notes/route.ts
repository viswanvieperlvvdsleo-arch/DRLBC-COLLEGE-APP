import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, createNotificationsAndPush, getUserOrError, notifyUsersByPreference, requireTeacherOrError } from "@/lib/api-utils";
import { saveUploadedFile } from "@/lib/upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mapNote = (note: {
  id: number;
  title: string;
  description: string;
  course: string;
  branch: string;
  section: string | null;
  year: string;
  subject: string;
  visibility: "CLASS_ONLY" | "VIEW_ALL";
  fileUrl: string;
  fileName: string;
  fileSize: string;
  createdAt: Date;
  authorId: string;
  author: { username: string; avatarUrl: string | null };
}) => ({
  id: note.id,
  title: note.title,
  description: note.description,
  author: note.author.username,
  authorId: note.authorId,
  date: note.createdAt.toISOString(),
  course: note.course,
  branch: note.branch,
  section: note.section ?? undefined,
  year: note.year,
  subject: note.subject,
  visibility: note.visibility === "CLASS_ONLY" ? "class_only" : "view_all",
  fileUrl: note.fileUrl,
  fileName: note.fileName,
  fileSize: note.fileSize,
  avatar: note.author.avatarUrl || "/avatar-placeholder.png",
});

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${sizes[i]}`;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId")?.trim() || "";
    const course = url.searchParams.get("course")?.trim() || "";
    const branch = url.searchParams.get("branch")?.trim() || "";
    const section = url.searchParams.get("section")?.trim() || "";
    const year = url.searchParams.get("year")?.trim() || "";
    const subject = url.searchParams.get("subject")?.trim() || "";

    let where: Record<string, unknown> = {};

    if (userId) {
      const { user, error } = await getUserOrError(userId);
      if (error) return error;

      if (user.role === "STUDENT") {
        const hasAcademicProfile = Boolean(
          user.course?.trim() &&
          user.branch?.trim() &&
          user.section?.trim() &&
          user.year?.trim()
        );

        where = {
          ...(subject ? { subject } : {}),
          OR: [
            { visibility: "VIEW_ALL" },
            ...(hasAcademicProfile
              ? [
                  {
                    visibility: "CLASS_ONLY",
                    course: user.course?.trim(),
                    branch: user.branch?.trim(),
                    section: user.section?.trim(),
                    year: user.year?.trim(),
                  },
                ]
              : []),
          ],
        };
      } else {
        where = {
          ...(course ? { course } : {}),
          ...(branch ? { branch } : {}),
          ...(section ? { section } : {}),
          ...(year ? { year } : {}),
          ...(subject ? { subject } : {}),
        };
      }
    } else {
      where = {
        ...(course ? { course } : {}),
        ...(branch ? { branch } : {}),
        ...(section ? { section } : {}),
        ...(year ? { year } : {}),
        ...(subject ? { subject } : {}),
      };
    }

    const notes = await prisma.note.findMany({
      where,
      include: { author: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ notes: notes.map(mapNote) });
  } catch (err) {
    console.error("NOTES GET API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return apiError("Expected multipart form data", 415);
    }

    const fd = await req.formData();
    const userId = String(fd.get("userId") || fd.get("authorId") || "").trim();
    const title = String(fd.get("title") || "").trim();
    const description = String(fd.get("description") || "").trim();
    const course = String(fd.get("course") || "").trim();
    const branch = String(fd.get("branch") || "").trim();
    const section = String(fd.get("section") || "").trim();
    const year = String(fd.get("year") || "").trim();
    const subject = String(fd.get("subject") || "").trim();
    const visibilityRaw = String(fd.get("visibility") || "class_only").trim().toLowerCase();
    const file = fd.get("file");

    if (!userId) return apiError("Missing userId", 400);
    if (!title || !description || !course || !branch || !year || !subject) {
      return apiError("Missing required fields", 400);
    }
    if (!(file instanceof File)) return apiError("Missing file", 400);

    const visibility =
      visibilityRaw === "view_all"
        ? "VIEW_ALL"
        : visibilityRaw === "class_only"
          ? "CLASS_ONLY"
          : null;
    if (!visibility) return apiError("Invalid visibility", 400);
    if (visibility === "CLASS_ONLY" && !section) {
      return apiError("Section is required for class-only notes", 400);
    }

    const { user, error } = await getUserOrError(userId);
    if (error) return error;
    const roleError = requireTeacherOrError(user.role, "Only teachers can upload notes");
    if (roleError) return roleError;

    const saved = await saveUploadedFile(file, "notes");
    const fileSize = formatBytes(file.size);

    const created = await prisma.note.create({
      data: {
        authorId: userId,
        title,
        description,
        course,
        branch,
        section: section || null,
        year,
        subject,
        visibility,
        fileUrl: saved.publicUrl,
        fileName: file.name || "note",
        fileSize,
      },
      include: { author: true },
    });

    if (visibility === "VIEW_ALL") {
      await notifyUsersByPreference({
        preferenceKey: "notifyPushNotes",
        actorId: userId,
        actorName: user.username,
        actorAvatar: user.avatarUrl,
        type: "NOTE",
        title: "New notes shared",
        description: `${user.username} shared notes for ${subject}.`,
        link: "/notes",
      });
    } else {
      const recipients = await prisma.user.findMany({
        where: {
          id: { not: userId },
          notifyPushNotes: true,
          OR: [
            { role: "TEACHER" },
            { role: "ADMIN" },
            {
              role: "STUDENT",
              course,
              branch,
              section,
              year,
            },
          ],
        },
        select: { id: true },
      });

      if (recipients.length > 0) {
        await createNotificationsAndPush({
          userIds: recipients.map((recipient) => recipient.id),
          type: "NOTE",
          title: "New class notes shared",
          description: `${user.username} shared notes for ${course} ${branch} ${section} ${year}.`,
          link: "/notes",
          actorName: user.username,
          actorAvatar: user.avatarUrl ?? null,
        });
      }
    }

    return NextResponse.json({ note: mapNote(created) }, { status: 201 });
  } catch (err) {
    console.error("NOTES POST API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const idRaw = url.searchParams.get("id") || url.searchParams.get("noteId") || "";
    const userId = url.searchParams.get("userId") || "";

    const noteId = Number(idRaw);
    if (!Number.isFinite(noteId) || noteId <= 0) {
      return apiError("Missing or invalid note id", 400);
    }
    if (!userId) {
      return apiError("Missing userId", 400);
    }

    const result = await prisma.note.deleteMany({
      where: { id: noteId, authorId: userId },
    });

    if (result.count === 0) {
      return apiError("Note not found or not allowed", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("NOTES DELETE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
