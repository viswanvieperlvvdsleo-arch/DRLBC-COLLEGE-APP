import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOrError, requireTeacherOrError, roleLabel } from "@/lib/api-utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const excludeId = searchParams.get("excludeId")?.trim();

    const users = await prisma.user.findMany({
      where: excludeId ? { id: { not: excludeId } } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        bio: true,
        avatarUrl: true,
        course: true,
        branch: true,
        section: true,
        year: true,
      },
      take: 500,
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        role: roleLabel(u.role),
        bio: u.bio ?? "",
        avatarUrl: u.avatarUrl ?? "/avatar-placeholder.png",
        course: u.course,
        branch: u.branch,
        section: u.section,
        year: u.year,
      })),
    });
  } catch (err) {
    console.error("USERS LIST GET CRASH:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { userId?: string; targetUserId?: string };
    const userId = body.userId?.trim() || "";
    const targetUserId = body.targetUserId?.trim() || "";

    if (!userId || !targetUserId) {
      return NextResponse.json({ error: "Missing userId or targetUserId" }, { status: 400 });
    }

    if (userId === targetUserId) {
      return NextResponse.json({ error: "You cannot delete your own account from Directory" }, { status: 400 });
    }

    const { user, error } = await getUserOrError(userId);
    if (error) return error;

    const roleError = requireTeacherOrError(user.role, "Only teachers can delete student accounts");
    if (roleError) return roleError;

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, username: true },
    });

    if (!target) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (target.role !== "STUDENT") {
      return NextResponse.json({ error: "Only student accounts can be deleted here" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: targetUserId } });

    return NextResponse.json({
      message: "Student account deleted",
      deletedUser: {
        id: target.id,
        username: target.username,
      },
    });
  } catch (err) {
    console.error("USERS DELETE CRASH:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
