import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type SettingsPayload = {
  userId?: string;
  username?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  theme?: string | null;
  notifyPushPosts?: boolean;
  notifyPushLikes?: boolean;
  notifyPushComments?: boolean;
  notifyPushMessages?: boolean;
  notifyPushReels?: boolean;
  notifyPushNotices?: boolean;
  notifyPushSchedule?: boolean;
  notifyPushNotes?: boolean;
  notifyPushInternships?: boolean;
  notifyNss?: boolean;
  notifyNcc?: boolean;
  notifyEmailDigest?: boolean;
  notifyEmailAnnouncements?: boolean;
};

const toSafeBoolean = (value: unknown) => typeof value === "boolean" ? value : undefined;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        course: user.course,
        branch: user.branch,
        section: user.section,
        year: user.year,
        pendingCourse: user.pendingCourse,
        pendingBranch: user.pendingBranch,
        pendingSection: user.pendingSection,
        pendingYear: user.pendingYear,
        theme: user.theme,
        notifyPushPosts: user.notifyPushPosts,
        notifyPushLikes: user.notifyPushLikes,
        notifyPushComments: user.notifyPushComments,
        notifyPushMessages: user.notifyPushMessages,
        notifyPushReels: user.notifyPushReels,
        notifyPushNotices: user.notifyPushNotices,
        notifyPushSchedule: user.notifyPushSchedule,
        notifyPushNotes: user.notifyPushNotes,
        notifyPushInternships: user.notifyPushInternships,
        notifyNss: user.notifyNss,
        notifyNcc: user.notifyNcc,
        notifyEmailDigest: user.notifyEmailDigest,
        notifyEmailAnnouncements: user.notifyEmailAnnouncements,
      },
    });
  } catch (err) {
    console.error("SETTINGS GET CRASH:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as SettingsPayload;
    const userId = body.userId?.trim();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const data: Prisma.UserUpdateInput = {};

    if (typeof body.username === "string") {
      const trimmed = body.username.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      data.username = trimmed;
    }

    if (typeof body.bio === "string" || body.bio === null) {
      data.bio = body.bio;
    }

    if (typeof body.avatarUrl === "string" || body.avatarUrl === null) {
      data.avatarUrl = body.avatarUrl;
    }

    if (typeof body.theme === "string" || body.theme === null) {
      data.theme = body.theme;
    }

    const notifyPushPosts = toSafeBoolean(body.notifyPushPosts);
    const notifyPushLikes = toSafeBoolean(body.notifyPushLikes);
    const notifyPushComments = toSafeBoolean(body.notifyPushComments);
    const notifyPushMessages = toSafeBoolean(body.notifyPushMessages);
    const notifyPushReels = toSafeBoolean(body.notifyPushReels);
    const notifyPushNotices = toSafeBoolean(body.notifyPushNotices);
    const notifyPushSchedule = toSafeBoolean(body.notifyPushSchedule);
    const notifyPushNotes = toSafeBoolean(body.notifyPushNotes);
    const notifyPushInternships = toSafeBoolean(body.notifyPushInternships);
    const notifyNss = toSafeBoolean(body.notifyNss);
    const notifyNcc = toSafeBoolean(body.notifyNcc);
    const notifyEmailDigest = toSafeBoolean(body.notifyEmailDigest);
    const notifyEmailAnnouncements = toSafeBoolean(body.notifyEmailAnnouncements);

    if (notifyPushPosts !== undefined) data.notifyPushPosts = notifyPushPosts;
    if (notifyPushLikes !== undefined) data.notifyPushLikes = notifyPushLikes;
    if (notifyPushComments !== undefined) data.notifyPushComments = notifyPushComments;
    if (notifyPushMessages !== undefined) data.notifyPushMessages = notifyPushMessages;
    if (notifyPushReels !== undefined) data.notifyPushReels = notifyPushReels;
    if (notifyPushNotices !== undefined) data.notifyPushNotices = notifyPushNotices;
    if (notifyPushSchedule !== undefined) data.notifyPushSchedule = notifyPushSchedule;
    if (notifyPushNotes !== undefined) data.notifyPushNotes = notifyPushNotes;
    if (notifyPushInternships !== undefined) data.notifyPushInternships = notifyPushInternships;
    if (notifyNss !== undefined) data.notifyNss = notifyNss;
    if (notifyNcc !== undefined) data.notifyNcc = notifyNcc;
    if (notifyEmailDigest !== undefined) data.notifyEmailDigest = notifyEmailDigest;
    if (notifyEmailAnnouncements !== undefined) data.notifyEmailAnnouncements = notifyEmailAnnouncements;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        role: updated.role,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        course: updated.course,
        branch: updated.branch,
        section: updated.section,
        year: updated.year,
        pendingCourse: updated.pendingCourse,
        pendingBranch: updated.pendingBranch,
        pendingSection: updated.pendingSection,
        pendingYear: updated.pendingYear,
        theme: updated.theme,
        notifyPushPosts: updated.notifyPushPosts,
        notifyPushLikes: updated.notifyPushLikes,
        notifyPushComments: updated.notifyPushComments,
        notifyPushMessages: updated.notifyPushMessages,
        notifyPushReels: updated.notifyPushReels,
        notifyPushNotices: updated.notifyPushNotices,
        notifyPushSchedule: updated.notifyPushSchedule,
        notifyPushNotes: updated.notifyPushNotes,
        notifyPushInternships: updated.notifyPushInternships,
        notifyNss: updated.notifyNss,
        notifyNcc: updated.notifyNcc,
        notifyEmailDigest: updated.notifyEmailDigest,
        notifyEmailAnnouncements: updated.notifyEmailAnnouncements,
      },
    });
  } catch (err) {
    console.error("SETTINGS PUT CRASH:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
