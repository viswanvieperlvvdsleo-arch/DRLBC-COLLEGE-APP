import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, getUserOrError, notifyUsersByPreference, requireTeacherOrError } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mapInternship = (internship: {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  uploaderId: string;
  postedAt: Date;
}) => ({
  id: internship.id,
  title: internship.title,
  company: internship.company,
  location: internship.location,
  description: internship.description,
  url: internship.url,
  uploaderId: internship.uploaderId,
  postedAt: internship.postedAt.toISOString(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim().toLowerCase() || "";

    const internships = await prisma.internship.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { company: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: { postedAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ internships: internships.map(mapInternship) });
  } catch (err) {
    console.error("INTERNSHIPS GET API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const userId = String(body.userId || body.uploaderId || "").trim();
    const title = String(body.title || "").trim();
    const company = String(body.company || "").trim();
    const location = String(body.location || "").trim();
    const description = String(body.description || "").trim();
    const url = String(body.url || "").trim();

    if (!userId) return apiError("Missing userId", 400);
    if (!title || !company || !location || !description || !url) {
      return apiError("Missing required fields", 400);
    }

    const { user, error } = await getUserOrError(userId);
    if (error) return error;
    const roleError = requireTeacherOrError(user.role, "Only teachers can post internships");
    if (roleError) return roleError;

    const created = await prisma.internship.create({
      data: {
        title,
        company,
        location,
        description,
        url,
        uploaderId: userId,
      },
    });

    await notifyUsersByPreference({
      preferenceKey: "notifyPushInternships",
      actorId: userId,
      actorName: user.username,
      actorAvatar: user.avatarUrl,
      type: "INTERNSHIP",
      title: "New internship",
      description: `${user.username} posted an internship at ${company}.`,
      link: "/internship",
    });

    return NextResponse.json({ internship: mapInternship(created) }, { status: 201 });
  } catch (err) {
    console.error("INTERNSHIPS POST API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id")?.trim() || "";
    const userId = url.searchParams.get("userId")?.trim() || "";

    if (!id || !userId) return apiError("Missing id or userId", 400);

    const { user, error } = await getUserOrError(userId);
    if (error) return error;

    const where = user.role === "ADMIN" ? { id } : { id, uploaderId: userId };
    const result = await prisma.internship.deleteMany({ where });

    if (result.count === 0) {
      return apiError("Internship not found or not allowed", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("INTERNSHIPS DELETE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
