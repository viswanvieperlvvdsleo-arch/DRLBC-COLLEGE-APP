import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hardDeleteUserAccount } from "@/lib/account-restrictions";

type AccountUpdatePayload = {
  userId?: string;
  currentPassword?: string;
  email?: string;
  newPassword?: string;
};

const buildUserResponse = (user: {
  id: string;
  email: string;
  username: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  theme: string | null;
  notifyPushPosts: boolean;
  notifyPushComments: boolean;
  notifyPushMessages: boolean;
  notifyEmailDigest: boolean;
  notifyEmailAnnouncements: boolean;
}) => ({
  user: {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    theme: user.theme,
    notifyPushPosts: user.notifyPushPosts,
    notifyPushComments: user.notifyPushComments,
    notifyPushMessages: user.notifyPushMessages,
    notifyEmailDigest: user.notifyEmailDigest,
    notifyEmailAnnouncements: user.notifyEmailAnnouncements,
  },
});

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as AccountUpdatePayload;
    const userId = body.userId?.trim();
    const currentPassword = body.currentPassword ?? "";

    if (!userId || !currentPassword) {
      return NextResponse.json(
        { error: "Missing userId or current password" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const data: Record<string, unknown> = {};

    if (typeof body.email === "string") {
      const email = body.email.trim().toLowerCase();
      if (!email) {
        return NextResponse.json({ error: "Email cannot be empty" }, { status: 400 });
      }
      if (email !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }
        data.email = email;
      }
    }

    if (typeof body.newPassword === "string") {
      if (body.newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      data.password = await bcrypt.hash(body.newPassword, 10);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json(buildUserResponse(updated));
  } catch (err) {
    console.error("ACCOUNT PUT CRASH:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    let body: AccountUpdatePayload = {};
    try {
      body = (await req.json()) as AccountUpdatePayload;
    } catch (err) {
      return NextResponse.json({ error: "Missing request body" }, { status: 400 });
    }

    const userId = body.userId?.trim();
    const currentPassword = body.currentPassword ?? "";

    if (!userId || !currentPassword) {
      return NextResponse.json(
        { error: "Missing userId or current password" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const deleted = await hardDeleteUserAccount(userId);
    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Account deleted",
      chatRetentionUntil: deleted.chatRetentionUntil,
    });
  } catch (err) {
    console.error("ACCOUNT DELETE CRASH:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
