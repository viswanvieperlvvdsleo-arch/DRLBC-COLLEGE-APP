import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, createNotificationsAndPush, getUserOrError } from "@/lib/api-utils";
import { purgeExpiredRestrictedChats } from "@/lib/account-restrictions";
import { hasActiveRealtimeConnection, publishToUsers } from "@/lib/realtime";
import { saveUploadedFile } from "@/lib/upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const formatTimestamp = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const placeholderAvatar = "/icons/clg_icon_128.png";
const onlineWindowMs = 30 * 1000;

type ParticipantRecord = {
  userId: string;
  username: string;
  email: string;
  userRole: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  muted: boolean;
  isDeletedAccount: boolean;
  deletedAt: Date | null;
  chatRetentionUntil: Date | null;
};

type LiveUserRecord = {
  id: string;
  username: string;
  email: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  lastSeenAt: Date | null;
};

const mapMessage = (message: {
  id: string;
  text: string | null;
  senderId: string;
  createdAt: Date;
  media: unknown;
  audioUrl: string | null;
  sharedPost: unknown;
  sharedReel: unknown;
  sharedNote: unknown;
  reactions: unknown;
  replyToId: string | null;
  isDeleted: boolean;
  isSystem: boolean;
  stars?: Array<{ userId: string }>;
}) => ({
  id: message.id,
  text: message.isDeleted ? "" : message.text ?? "",
  timestamp: formatTimestamp(message.createdAt),
  createdAt: message.createdAt.toISOString(),
  senderId: message.senderId,
  isStarred: Array.isArray(message.stars) ? message.stars.length > 0 : false,
  sharedPost: message.sharedPost ?? undefined,
  sharedReel: message.sharedReel ?? undefined,
  sharedNote: message.sharedNote ?? undefined,
  media: Array.isArray(message.media) ? message.media : undefined,
  audioUrl: message.audioUrl ?? undefined,
  reactions: Array.isArray(message.reactions) ? message.reactions : undefined,
  replyToId: message.replyToId ?? undefined,
  isDeleted: message.isDeleted,
  isSystem: message.isSystem,
});

const ensureParticipant = async (chatId: string, userId: string) => {
  if (!userId) return false;
  const membership = await prisma.chatParticipant.findUnique({
    where: { chatId_userId: { chatId, userId } },
  });
  return Boolean(membership);
};

const participantSelect = {
  userId: true,
  username: true,
  email: true,
  userRole: true,
  bio: true,
  avatarUrl: true,
  role: true,
  muted: true,
  isDeletedAccount: true,
  deletedAt: true,
  chatRetentionUntil: true,
} as const;

const fetchLiveUsersMap = async (userIds: string[]) => {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return new Map<string, LiveUserRecord>();
  }

  const users = await prisma.user.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      bio: true,
      avatarUrl: true,
      lastSeenAt: true,
    },
  });

  return new Map(users.map((user) => [user.id, user]));
};

const mapParticipantUser = (
  participant: ParticipantRecord,
  liveUsers: Map<string, LiveUserRecord>
) => {
  const liveUser = liveUsers.get(participant.userId);
  const isDeletedAccount = participant.isDeletedAccount || !liveUser;
  const username = liveUser?.username ?? participant.username;
  const role = liveUser?.role ?? participant.userRole;
  const bio = liveUser?.bio ?? participant.bio;
  const avatarUrl = liveUser?.avatarUrl ?? participant.avatarUrl;
  const lastSeenAt = liveUser?.lastSeenAt ?? null;

  return {
    id: participant.userId,
    name: isDeletedAccount ? `${username} (Restricted)` : username,
    avatar: avatarUrl || placeholderAvatar,
    email: liveUser?.email ?? participant.email,
    role: role === "STUDENT" ? "Student" : "Professor",
    department: "-",
    bio: isDeletedAccount ? "This account was restricted by the college." : bio ?? "",
    isRestricted: isDeletedAccount,
    restrictedAt: participant.deletedAt?.toISOString(),
    chatRetentionUntil: participant.chatRetentionUntil?.toISOString(),
    isOnline: Boolean(
      !isDeletedAccount &&
        (hasActiveRealtimeConnection(participant.userId) ||
          (lastSeenAt ? Date.now() - lastSeenAt.getTime() < onlineWindowMs : false))
    ),
  };
};

const getDirectChatRestriction = async (chatId: string) => {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: {
      isGroup: true,
      participants: {
        select: participantSelect,
      },
    },
  });

  if (!chat || chat.isGroup) {
    return null;
  }

  return chat.participants.find((participant) => participant.isDeletedAccount) ?? null;
};

const getRealtimeChatPayload = async (chatId: string, latestMessage: ReturnType<typeof mapMessage>) => {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      participants: {
        select: participantSelect,
      },
    },
  });

  if (!chat) return null;

  const liveUsers = await fetchLiveUsersMap(
    chat.participants
      .filter((participant) => !participant.isDeletedAccount)
      .map((participant) => participant.userId)
  );

  return {
    participantIds: chat.participants
      .filter((participant) => !participant.isDeletedAccount)
      .map((participant) => participant.userId),
    chat: {
      id: chat.id,
      name: chat.name ?? undefined,
      isGroup: chat.isGroup,
      groupAvatar: chat.groupAvatar ?? undefined,
      users: chat.participants.map((participant) => mapParticipantUser(participant, liveUsers)),
      admins: chat.participants
        .filter((participant) => participant.role === "ADMIN")
        .map((participant) => participant.userId),
      unreadCount: 0,
      messages: [latestMessage],
    },
  };
};

export async function GET(req: Request, context: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await context.params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim() || "";

    if (!chatId) {
      return apiError("Missing chatId", 400);
    }
    if (!userId) {
      return apiError("Missing userId", 400);
    }
    const { error } = await getUserOrError(userId);
    if (error) return error;

    await purgeExpiredRestrictedChats();

    if (!(await ensureParticipant(chatId, userId))) {
      return apiError("Not allowed", 403);
    }

    const limitRaw = Number(searchParams.get("limit") || "50");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;
    const before = searchParams.get("before")?.trim();
    const beforeDate = before ? new Date(before) : null;

    if (beforeDate && Number.isNaN(beforeDate.getTime())) {
      return apiError("Invalid before cursor", 400);
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        chatId,
        ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
        isDeleted: false,
        hides: { none: { userId } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      include: {
        stars: { where: { userId }, select: { userId: true } },
      },
    });

    const hasMore = messages.length > limit;
    const trimmed = messages.slice(0, limit).reverse();

    return NextResponse.json({ messages: trimmed.map(mapMessage), hasMore });
  } catch (err) {
    console.error("CHAT MESSAGES GET API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: Request, context: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await context.params;
    if (!chatId) {
      return apiError("Missing chatId", 400);
    }

    const contentType = req.headers.get("content-type") || "";
    let userId = "";
    let text = "";
    let replyToId = "";
    let sharedPost: unknown = null;
    let sharedReel: unknown = null;
    let sharedNote: unknown = null;
    let sharedMedia: Array<{ type: string; url: string; fileName?: string }> = [];
    const mediaUploads: Array<{ type: string; url: string; fileName?: string }> = [];

    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData();
      userId = String(fd.get("userId") || fd.get("senderId") || "").trim();
      text = String(fd.get("text") || fd.get("caption") || "").trim();
      replyToId = String(fd.get("replyToId") || "").trim();

      const fileItems = fd.getAll("files").concat(fd.getAll("file"));
      const files = fileItems.filter((item): item is File => item instanceof File);

      for (const file of files) {
        const saved = await saveUploadedFile(file, "chat");
        mediaUploads.push({
          type: file.type || "application/octet-stream",
          url: saved.publicUrl,
          fileName: file.name || undefined,
        });
      }
    } else {
      const body = (await req.json()) as Record<string, unknown>;
      userId = String(body.userId || body.senderId || "").trim();
      text = String(body.text || "").trim();
      replyToId = String(body.replyToId || "").trim();
      sharedPost = body.sharedPost ?? null;
      sharedReel = body.sharedReel ?? null;
      sharedNote = body.sharedNote ?? null;
      if (Array.isArray(body.media)) {
        sharedMedia = body.media
          .filter((item) => item && typeof item === "object")
          .map((item) => {
            const record = item as Record<string, unknown>;
            return {
              type: String(record.type || "application/octet-stream"),
              url: String(record.url || ""),
              fileName: record.fileName ? String(record.fileName) : undefined,
            };
          })
          .filter((item) => item.url);
      }
    }

    if (!userId) {
      return apiError("Missing userId", 400);
    }
    const { error } = await getUserOrError(userId);
    if (error) return error;

    await purgeExpiredRestrictedChats();

    if (!(await ensureParticipant(chatId, userId))) {
      return apiError("Not allowed", 403);
    }

    const restrictedParticipant = await getDirectChatRestriction(chatId);
    if (restrictedParticipant) {
      return apiError("This chat is read-only because the other account was restricted.", 403);
    }

    if (
      !text &&
      mediaUploads.length === 0 &&
      sharedMedia.length === 0 &&
      !sharedPost &&
      !sharedReel &&
      !sharedNote
    ) {
      return apiError("Message is empty", 400);
    }

    const created = await prisma.chatMessage.create({
      data: {
        chatId,
        senderId: userId,
        text: text || null,
        replyToId: replyToId || null,
        media: mediaUploads.length > 0 ? mediaUploads : sharedMedia.length > 0 ? sharedMedia : undefined,
        sharedPost: sharedPost || undefined,
        sharedReel: sharedReel || undefined,
        sharedNote: sharedNote || undefined,
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        avatarUrl: true,
      },
    });

    const chatParticipants = await prisma.chatParticipant.findMany({
      where: {
        chatId,
        userId: { not: userId },
        isDeletedAccount: false,
      },
      select: {
        userId: true,
      },
    });

    const pushRecipients = await prisma.user.findMany({
      where: {
        id: { in: chatParticipants.map((participant) => participant.userId) },
        notifyPushMessages: true,
      },
      select: { id: true },
    });

    if (pushRecipients.length > 0 && sender) {
      const chatInfo = await prisma.chat.findUnique({
        where: { id: chatId },
        select: { isGroup: true, name: true },
      });
      const messagePreview =
        text || (mediaUploads.length || sharedMedia.length ? "Sent an attachment" : "Shared something");

      await createNotificationsAndPush({
        userIds: pushRecipients.map((recipient) => recipient.id),
        type: "MESSAGE",
        title: chatInfo?.isGroup
          ? `New message in ${chatInfo.name || "group chat"}`
          : `New message from ${sender.username}`,
        description: messagePreview,
        link: `/chat?id=${chatId}`,
        actorName: sender.username,
        actorAvatar: sender.avatarUrl ?? null,
      });
    }

    const realtimeMessage = mapMessage(created);
    const realtimePayload = await getRealtimeChatPayload(chatId, realtimeMessage);
    if (realtimePayload) {
      publishToUsers(
        realtimePayload.participantIds,
        "chat-message",
        {
          chat: realtimePayload.chat,
          message: realtimeMessage,
        },
        { excludeUserIds: [userId] }
      );
    }

    return NextResponse.json({ message: realtimeMessage }, { status: 201 });
  } catch (err) {
    console.error("CHAT MESSAGE POST API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await context.params;
    if (!chatId) return apiError("Missing chatId", 400);

    const body = (await req.json()) as Record<string, unknown>;
    const userId = String(body.userId || body.senderId || "").trim();
    const messageId = String(body.messageId || "").trim();
    const action = String(body.action || "edit").trim();

    if (!userId || !messageId) {
      return apiError("Missing userId or messageId", 400);
    }
    const { error } = await getUserOrError(userId);
    if (error) return error;

    await purgeExpiredRestrictedChats();

    if (!(await ensureParticipant(chatId, userId))) {
      return apiError("Not allowed", 403);
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, chatId: true },
    });
    if (!message || message.chatId !== chatId) {
      return apiError("Message not found", 404);
    }

    if (action === "star" || action === "unstar") {
      if (action === "star") {
        await prisma.chatMessageStar.upsert({
          where: { messageId_userId: { messageId, userId } },
          update: {},
          create: { messageId, userId },
        });
      } else {
        await prisma.chatMessageStar.deleteMany({ where: { messageId, userId } });
      }

      const refreshed = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        include: {
          stars: { where: { userId }, select: { userId: true } },
        },
      });
      if (!refreshed) return apiError("Message not found", 404);
      const realtimeMessage = mapMessage(refreshed);
      const realtimePayload = await getRealtimeChatPayload(chatId, realtimeMessage);
      if (realtimePayload) {
        publishToUsers(
          realtimePayload.participantIds,
          "chat-message-updated",
          { chatId, message: realtimeMessage },
          { excludeUserIds: [userId] }
        );
      }
      return NextResponse.json({ message: realtimeMessage });
    }

    if (message.senderId !== userId) {
      return apiError("Not allowed", 403);
    }

    const newText = String(body.text || "").trim();
    if (!newText) return apiError("Message text is required", 400);

    const updated = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { text: newText },
      include: {
        stars: { where: { userId }, select: { userId: true } },
      },
    });

    const realtimeMessage = mapMessage(updated);
    const realtimePayload = await getRealtimeChatPayload(chatId, realtimeMessage);
    if (realtimePayload) {
      publishToUsers(
        realtimePayload.participantIds,
        "chat-message-updated",
        { chatId, message: realtimeMessage },
        { excludeUserIds: [userId] }
      );
    }

    return NextResponse.json({ message: realtimeMessage });
  } catch (err) {
    console.error("CHAT MESSAGE PATCH API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await context.params;
    if (!chatId) return apiError("Missing chatId", 400);

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId")?.trim() || "";
    const userId = searchParams.get("userId")?.trim() || "";
    const scope = searchParams.get("scope")?.trim() || "everyone";

    if (!messageId || !userId) {
      return apiError("Missing messageId or userId", 400);
    }
    const { error } = await getUserOrError(userId);
    if (error) return error;

    await purgeExpiredRestrictedChats();

    if (!(await ensureParticipant(chatId, userId))) {
      return apiError("Not allowed", 403);
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, chatId: true },
    });
    if (!message || message.chatId !== chatId) {
      return apiError("Message not found", 404);
    }

    if (scope === "me") {
      await prisma.chatMessageHidden.upsert({
        where: { messageId_userId: { messageId, userId } },
        update: {},
        create: { messageId, userId },
      });
      return NextResponse.json({ ok: true });
    }

    if (message.senderId !== userId) {
      return apiError("Not allowed", 403);
    }

    const updated = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        text: null,
        media: null,
        audioUrl: null,
        sharedPost: null,
        sharedReel: null,
        sharedNote: null,
        reactions: null,
      },
      include: {
        stars: { where: { userId }, select: { userId: true } },
      },
    });

    const realtimeMessage = mapMessage(updated);
    const realtimePayload = await getRealtimeChatPayload(chatId, realtimeMessage);
    if (realtimePayload) {
      publishToUsers(
        realtimePayload.participantIds,
        "chat-message-updated",
        { chatId, message: realtimeMessage },
        { excludeUserIds: [userId] }
      );
    }

    return NextResponse.json({ message: realtimeMessage });
  } catch (err) {
    console.error("CHAT MESSAGE DELETE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
