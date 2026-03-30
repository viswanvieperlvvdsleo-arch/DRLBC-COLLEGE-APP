import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        bio: true,
        avatarUrl: true,
        course: true,
        branch: true,
        section: true,
        year: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const onlineWindowMs = 30 * 1000;

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        course: user.course,
        branch: user.branch,
        section: user.section,
        year: user.year,
        lastSeenAt: user.lastSeenAt,
        createdAt: user.createdAt,
        isOnline: user.lastSeenAt ? Date.now() - user.lastSeenAt.getTime() < onlineWindowMs : false,
      },
    });
  } catch (err) {
    console.error("PROFILE GET CRASH:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
