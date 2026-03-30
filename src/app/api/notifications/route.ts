import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-utils";
import { NotificationType } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mapNotification = (n: {
  id: string;
  type: string;
  title: string;
  description: string;
  link: string;
  actorName: string;
  actorAvatar: string | null;
  read: boolean;
  createdAt: Date;
}) => ({
  id: n.id,
  type: n.type.toLowerCase(),
  title: n.title,
  description: n.description,
  link: n.link,
  actor: {
    name: n.actorName,
    avatar: n.actorAvatar || "/avatar-placeholder.png",
  },
  read: n.read,
  timestamp: n.createdAt.toISOString(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId")?.trim() || "";
    const takeRaw = Number(url.searchParams.get("take") || "100");
    const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 200) : 100;

    if (!userId) return apiError("Missing userId", 400);

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    });

    return NextResponse.json({ notifications: notifications.map(mapNotification) });
  } catch (err) {
    console.error("NOTIFICATIONS GET API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      userId?: string;
      title?: string;
      description?: string;
      link?: string;
      actorName?: string;
      actorAvatar?: string | null;
      type?: string;
    };
    const userId = body.userId?.trim() || "";
    if (!userId) return apiError("Missing userId", 400);

    const typeUpper = (body.type || "NOTICE").toUpperCase();
    const type = Object.values(NotificationType).includes(typeUpper as NotificationType)
      ? (typeUpper as NotificationType)
      : NotificationType.NOTICE;

    const created = await prisma.notification.create({
      data: {
        userId,
        title: body.title?.trim() || "Notification",
        description: body.description?.trim() || "",
        link: body.link?.trim() || "",
        actorName: body.actorName?.trim() || "System",
        actorAvatar: body.actorAvatar || null,
        type,
      },
    });

    return NextResponse.json({ notificationId: created.id }, { status: 201 });
  } catch (err) {
    console.error("NOTIFICATIONS POST CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId")?.trim() || "";
    const markAll = url.searchParams.get("all") === "true";
    const body = (await req.json()) as Record<string, unknown>;
    const id = String(body.id || "").trim();
    const read = typeof body.read === "boolean" ? body.read : true;

    if (!userId) return apiError("Missing userId", 400);

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId },
        data: { read },
      });
      return NextResponse.json({ ok: true });
    }

    if (!id) return apiError("Missing id", 400);

    const result = await prisma.notification.updateMany({
      where: { id, userId },
      data: { read },
    });

    if (result.count === 0) {
      return apiError("Notification not found", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("NOTIFICATIONS PATCH API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId")?.trim() || "";
    const clearAll = url.searchParams.get("all") === "true";
    const body = (await req.json()) as Record<string, unknown>;
    const id = String(body.id || "").trim();

    if (!userId) return apiError("Missing userId", 400);

    if (clearAll) {
      await prisma.notification.deleteMany({ where: { userId } });
      return NextResponse.json({ ok: true });
    }

    if (!id) return apiError("Missing id", 400);

    const result = await prisma.notification.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return apiError("Notification not found", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("NOTIFICATIONS DELETE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
