import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sendWebPushToUsers } from "@/lib/web-push";

export type MediaType = "IMAGE" | "VIDEO";

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function roleLabel(dbRole?: string) {
  switch (dbRole) {
    case "STUDENT":
      return "Student";
    case "TEACHER":
    case "ADMIN":
      return "Professor";
    default:
      return "Student";
  }
}

export function inferMediaType(file: File): MediaType | null {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("video/")) return "VIDEO";
  return null;
}

export async function getUserOrError(authorId: string) {
  const user = await prisma.user.findUnique({ where: { id: authorId } });
  if (!user) {
    return { user: null as const, error: apiError("User not found", 404) };
  }
  if (user.restrictedAt) {
    return {
      user: null as const,
      error: apiError("This account has been restricted and can no longer use the app.", 403),
    };
  }
  return { user, error: null as const };
}

export function requireTeacherOrError(dbRole?: string, message = "Only teachers can post this content") {
  if (dbRole !== "TEACHER" && dbRole !== "ADMIN") {
    return apiError(message, 403);
  }
  return null;
}

export type ParsedCreate = {
  authorId: string;
  caption: string;
  file: File | null;
};

export async function parseCreateRequest(req: Request, opts?: { allowJson?: boolean }) {
  const allowJson = opts?.allowJson ?? false;
  const contentType = req.headers.get("content-type") || "";

  let authorId = "";
  let caption = "";
  let file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData();
    authorId = String(fd.get("authorId") || fd.get("userId") || "");
    caption = String(fd.get("caption") || fd.get("content") || "").trim();
    const maybeFile = fd.get("file");
    file = maybeFile instanceof File ? maybeFile : null;
  } else if (allowJson) {
    const body = (await req.json()) as Record<string, unknown>;
    authorId = String(body.authorId || body.userId || "");
    caption = String(body.caption || body.content || "").trim();
  }

  return { authorId, caption, file } satisfies ParsedCreate;
}

export async function parseMultipartRequired(req: Request) {
  const fd = await req.formData();
  const authorId = String(fd.get("authorId") || fd.get("userId") || "");
  const caption = String(fd.get("caption") || "").trim();
  const maybeFile = fd.get("file");
  const file = maybeFile instanceof File ? maybeFile : null;

  return { authorId, caption, file } satisfies ParsedCreate;
}

export type NotificationPreferenceKey =
  | "notifyPushPosts"
  | "notifyPushLikes"
  | "notifyPushComments"
  | "notifyPushMessages"
  | "notifyPushReels"
  | "notifyPushNotices"
  | "notifyPushSchedule"
  | "notifyPushNotes"
  | "notifyPushInternships";

type NotificationPayload = {
  type: string;
  title: string;
  description: string;
  link: string;
  actorName: string;
  actorAvatar?: string | null;
  actorId?: string;
};

export async function createNotificationsAndPush(params: {
  userIds: string[];
} & NotificationPayload) {
  const { userIds, ...payload } = params;
  const recipients = Array.from(new Set(userIds.filter(Boolean)));

  if (recipients.length === 0) return 0;

  await prisma.notification.createMany({
    data: recipients.map((recipientId) => ({
      userId: recipientId,
      type: payload.type as Prisma.NotificationType,
      title: payload.title,
      description: payload.description,
      link: payload.link,
      actorName: payload.actorName,
      actorAvatar: payload.actorAvatar ?? null,
    })),
  });

  await sendWebPushToUsers(recipients, {
    title: payload.title,
    body: payload.description,
    url: payload.link || "/home",
    tag: `${String(payload.type || "notice").toLowerCase()}-${Date.now()}`,
  });

  return recipients.length;
}

export async function notifyUsersByPreference(params: {
  preferenceKey: NotificationPreferenceKey;
  actorId?: string;
} & NotificationPayload) {
  const { preferenceKey, actorId, ...payload } = params;

  const where = {
    ...(actorId ? { id: { not: actorId } } : {}),
    restrictedAt: null,
    [preferenceKey]: true,
  } satisfies Prisma.UserWhereInput;

  const recipients = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  if (recipients.length === 0) return 0;
  return createNotificationsAndPush({
    userIds: recipients.map((recipient) => recipient.id),
    ...payload,
  });
}

export async function notifyUserByPreference(params: {
  userId: string;
  preferenceKey: NotificationPreferenceKey;
  actorId?: string;
} & NotificationPayload) {
  const { userId, preferenceKey, actorId, ...payload } = params;
  if (!userId) return false;
  if (actorId && userId === actorId) return false;

  const where = {
    id: userId,
    restrictedAt: null,
    [preferenceKey]: true,
  } satisfies Prisma.UserWhereInput;

  const allowed = await prisma.user.findFirst({
    where,
    select: { id: true },
  });

  if (!allowed) return false;
  await createNotificationsAndPush({
    userIds: [userId],
    ...payload,
  });

  return true;
}
