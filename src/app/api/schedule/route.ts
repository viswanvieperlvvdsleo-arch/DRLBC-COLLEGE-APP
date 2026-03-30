import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, getUserOrError, notifyUsersByPreference, requireTeacherOrError } from "@/lib/api-utils";
import { saveUploadedFile } from "@/lib/upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toDbCategory = (value: string | null) => {
  switch ((value || "").toLowerCase()) {
    case "timetable":
      return "TIMETABLE";
    case "attendance":
      return "ATTENDANCE";
    case "results":
      return "RESULTS";
    default:
      return null;
  }
};

const toUiCategory = (value: string) => {
  switch (value) {
    case "TIMETABLE":
      return "timetable";
    case "ATTENDANCE":
      return "attendance";
    case "RESULTS":
      return "results";
    default:
      return "timetable";
  }
};

const mapFile = (file: {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  isImage: boolean;
  category: string;
  course: string;
  branch: string;
  year: string;
  section: string | null;
  uploaderId: string;
}) => ({
  id: file.id,
  name: file.fileName,
  url: file.fileUrl,
  fileType: file.fileType,
  isImage: file.isImage,
  category: toUiCategory(file.category),
  course: file.course,
  branch: file.branch,
  year: file.year,
  section: file.section ?? null,
  uploaderId: file.uploaderId,
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = toDbCategory(url.searchParams.get("category"));
    const userId = url.searchParams.get("userId")?.trim() || "";
    let course = url.searchParams.get("course")?.trim() || "";
    let branch = url.searchParams.get("branch")?.trim() || "";
    let year = url.searchParams.get("year")?.trim() || "";
    let section = url.searchParams.get("section")?.trim() || "";

    if (userId) {
      const { user, error } = await getUserOrError(userId);
      if (error) return error;

      if (user.role === "STUDENT") {
        course = user.course?.trim() || "";
        branch = user.branch?.trim() || "";
        year = user.year?.trim() || "";
        section = user.section?.trim() || "";

        if (!course || !branch || !year || !section) {
          return NextResponse.json({
            file: null,
            files: [],
            error: "Student academic profile is incomplete",
          });
        }
      }
    }

    if (!category || !course || !branch || !year) {
      return NextResponse.json({ file: null, files: [] });
    }

    const files = await prisma.scheduleFile.findMany({
      where: { category, course, branch, year, section: section || undefined },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    const mapped = files.map(mapFile);
    return NextResponse.json({ file: mapped[0] ?? null, files: mapped });
  } catch (err) {
    console.error("SCHEDULE GET API CRASH:", err);
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
    const categoryRaw = String(fd.get("category") || "").trim();
    const course = String(fd.get("course") || "").trim();
    const branch = String(fd.get("branch") || "").trim();
    const year = String(fd.get("year") || "").trim();
    const section = String(fd.get("section") || "").trim();
    const file = fd.get("file");

    if (!userId) return apiError("Missing userId", 400);
    const category = toDbCategory(categoryRaw);
    if (!category) return apiError("Invalid category", 400);
    if (!course || !branch || !year) return apiError("Missing filters", 400);
    if (!(file instanceof File)) return apiError("Missing file", 400);

    const { user, error } = await getUserOrError(userId);
    if (error) return error;
    const roleError = requireTeacherOrError(user.role, "Only teachers can upload schedules");
    if (roleError) return roleError;

    const saved = await saveUploadedFile(file, "schedule");
    const created = await prisma.scheduleFile.create({
      data: {
        category,
        course,
        branch,
        year,
        section: section || null,
        fileName: file.name || "schedule",
        fileUrl: saved.publicUrl,
        fileType: file.type || "application/octet-stream",
        isImage: file.type.startsWith("image/"),
        uploaderId: userId,
      },
    });

    await notifyUsersByPreference({
      preferenceKey: "notifyPushSchedule",
      actorId: userId,
      actorName: user.username,
      actorAvatar: user.avatarUrl,
      type: "SCHEDULE",
      title: "Schedule updated",
      description: `${user.username} uploaded a new schedule for ${course} ${branch} ${year}${section ? " " + section : ""}.`,
      link: "/schedule",
    });

    return NextResponse.json({ file: mapFile(created) }, { status: 201 });
  } catch (err) {
    console.error("SCHEDULE POST API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id")?.trim() || "";
    const userId = url.searchParams.get("userId")?.trim() || "";

    if (!id || !userId) {
      return apiError("Missing id or userId", 400);
    }

    const { user, error } = await getUserOrError(userId);
    if (error) return error;

    const where = user.role === "ADMIN" ? { id } : { id, uploaderId: userId };
    const result = await prisma.scheduleFile.deleteMany({ where });

    if (result.count === 0) {
      return apiError("File not found or not allowed", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("SCHEDULE DELETE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}





