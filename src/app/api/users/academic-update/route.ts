import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, getUserOrError } from "@/lib/api-utils";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { userId?: string };
    const userId = String(body.userId || "").trim();

    if (!userId) {
      return apiError("Missing userId", 400);
    }

    const { user, error } = await getUserOrError(userId);
    if (error) return error;

    if (user.role !== "STUDENT") {
      return apiError("Only students can acknowledge academic updates", 403);
    }

    if (!user.pendingCourse || !user.pendingBranch || !user.pendingSection || !user.pendingYear) {
      return apiError("No pending academic update found", 400);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        course: user.pendingCourse,
        branch: user.pendingBranch,
        section: user.pendingSection,
        year: user.pendingYear,
        pendingCourse: null,
        pendingBranch: null,
        pendingSection: null,
        pendingYear: null,
      },
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        role: updated.role,
        course: updated.course,
        branch: updated.branch,
        section: updated.section,
        year: updated.year,
        pendingCourse: updated.pendingCourse,
        pendingBranch: updated.pendingBranch,
        pendingSection: updated.pendingSection,
        pendingYear: updated.pendingYear,
      },
    });
  } catch (err) {
    console.error("ACADEMIC UPDATE ACKNOWLEDGE CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
