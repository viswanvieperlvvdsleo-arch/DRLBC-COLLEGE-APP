import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, roleLabel } from "@/lib/api-utils";
import { hasActiveRealtimeConnection, publishToUsers } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const placeholderAvatar = "/icons/clg_icon_128.png";
const onlineWindowMs = 30 * 1000;

const formatTimestamp = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const mapUser = (user: {
  id: string;
  username: string;
  email: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  lastSeenAt: Date | null;
}) => ({
  id: user.id,
  name: user.username,
  avatar: user.avatarUrl || placeholderAvatar,
  email: user.email ?? "",
  role: roleLabel(user.role),
  department: "-",
  bio: user.bio ?? "",
  isOnline:
    hasActiveRealtimeConnection(user.id) ||
    (user.lastSeenAt ? Date.now() - user.lastSeenAt.getTime() < onlineWindowMs : false),
});

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

const participantSelect = {
  role: true,
  muted: true,
  user: {
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      bio: true,
      avatarUrl: true,
      lastSeenAt: true,
    },
  },
} as const;

const mapChat = (chat: {
  id: string;
  name: string | null;
  isGroup: boolean;
  groupAvatar: string | null;
  participants: Array<{
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      bio: string | null;
      avatarUrl: string | null;
      lastSeenAt: Date | null;
    };
    role: string;
    muted: boolean;
  }>;
  messages: Array<{
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
  }>;
}, viewerId?: string) => {
  const viewerParticipant = viewerId
    ? chat.participants.find((p) => p.user.id === viewerId)
    : undefined;

  return {
    id: chat.id,
    name: chat.name ?? undefined,
    isGroup: chat.isGroup,
    groupAvatar: chat.groupAvatar ?? undefined,
    users: chat.participants.map((p) => mapUser(p.user)),
    admins: chat.participants.filter((p) => p.role === "ADMIN").map((p) => p.user.id),
    messages: chat.messages.map(mapMessage).reverse(),
    unreadCount: 0,
    isMuted: viewerParticipant?.muted ?? false,
  };
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();

    if (!userId) {
      return apiError("Missing userId", 400);
    }

    const chats = await prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      include: {
        participants: { select: participantSelect },
        messages: {
          orderBy: { createdAt: "desc" },
          where: { isDeleted: false },
          take: 1,
          include: {
            stars: { where: { userId }, select: { userId: true } },
          },
        },
      },
    });

    return NextResponse.json({ chats: chats.map((chat) => mapChat(chat, userId)) });
  } catch (err) {
    console.error("CHATS GET API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const userId = String(body.userId || body.creatorId || "").trim();
    const otherUserId = String(body.otherUserId || body.peerId || "").trim();

    if (!userId) {
      return apiError("Missing userId", 400);
    }

    if (otherUserId) {
      if (otherUserId === userId) {
        return apiError("Cannot create a chat with yourself", 400);
      }

      const users = await prisma.user.findMany({
        where: { id: { in: [userId, otherUserId] } },
        select: { id: true, role: true },
      });

      if (users.length !== 2) {
        return apiError("One or more users not found", 404);
      }

      const isStudent = (role: string) => role?.toLowerCase() === "student";
      const initiator = users.find((u) => u.id === userId)!;
      const peer = users.find((u) => u.id === otherUserId)!;

      const initiatorIsStudent = isStudent(initiator.role);
      const peerIsStudent = isStudent(peer.role);

      // Restrict only student–student chats; teacher–teacher and teacher–student are allowed
      if (initiatorIsStudent && peerIsStudent) {
        return apiError(
          "Student-to-student chats are disabled. Please contact a teacher instead.",
          403
        );
      }

      const existing = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          participants: {
            some: { userId },
            every: { userId: { in: [userId, otherUserId] } },
          },
        },
        include: {
          participants: { select: participantSelect },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });

      if (existing) {
        return NextResponse.json({ chat: mapChat(existing, userId) });
      }

      const created = await prisma.chat.create({
        data: {
          isGroup: false,
          participants: {
            create: [{ userId }, { userId: otherUserId }],
          },
        },
        include: {
          participants: { select: participantSelect },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });

      publishToUsers(
        [otherUserId],
        "chat-upsert",
        { chat: mapChat(created) },
        { excludeUserIds: [userId] }
      );

      return NextResponse.json({ chat: mapChat(created, userId) }, { status: 201 });
     }

    const memberIdsRaw = Array.isArray(body.memberIds) ? body.memberIds : [];
    const memberIds = memberIdsRaw
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0);

    if (memberIds.length === 0) {
      return apiError("Missing memberIds", 400);
    }

    // Only allow non-students (teachers/admins) to create groups
    const creator = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isStudent = (r?: string) => r?.toLowerCase() === "student";
    if (!creator || isStudent(creator.role)) {
      return apiError("Only teachers can create group chats.", 403);
    }

    const name = String(body.name || "").trim();
    const groupAvatar = String(body.groupAvatar || "").trim() || null;

    const uniqueIds = Array.from(new Set([userId, ...memberIds]));

    const created = await prisma.chat.create({
      data: {
        isGroup: true,
        name,
        groupAvatar,
        participants: {
          create: uniqueIds.map((id) => ({
            userId: id,
            role: id === userId ? "ADMIN" : "MEMBER",
          })),
        },
      },
      include: {
        participants: { select: participantSelect },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    publishToUsers(
      uniqueIds,
      "chat-upsert",
      { chat: mapChat(created) },
      { excludeUserIds: [userId] }
    );

    return NextResponse.json({ chat: mapChat(created, userId) }, { status: 201 });
  } catch (err) {
    console.error("CHATS POST API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const chatId = url.searchParams.get("id")?.trim();
    const userId = url.searchParams.get("userId")?.trim();

    if (!chatId || !userId) {
      return apiError("Missing chatId or userId", 400);
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          select: {
            role: true,
            userId: true,
          },
        },
      },
    });

    if (!chat || !chat.isGroup) {
      return apiError("Chat not found", 404);
    }

    const participant = chat.participants.find((p) => p.userId === userId);
    if (!participant || participant.role !== "ADMIN") {
      return apiError("Only group admins can delete the group.", 403);
    }

    await prisma.chat.delete({ where: { id: chatId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("CHATS DELETE API CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
