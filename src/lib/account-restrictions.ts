import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const RESTRICTED_CHAT_RETENTION_DAYS = 24;

export const getChatRetentionDeadline = (from = new Date()) =>
  new Date(from.getTime() + RESTRICTED_CHAT_RETENTION_DAYS * DAY_IN_MS);

type UserSnapshot = {
  id: string;
  username: string;
  email: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
};

const applyDeletedAccountSnapshot = async (
  tx: Prisma.TransactionClient,
  user: UserSnapshot
) => {
  const now = new Date();
  const retentionDeadline = getChatRetentionDeadline(now);

  const memberships = await tx.chatParticipant.findMany({
    where: { userId: user.id },
    select: {
      chatId: true,
      chat: {
        select: {
          isGroup: true,
        },
      },
    },
  });

  const directChatIds = memberships
    .filter((membership) => !membership.chat.isGroup)
    .map((membership) => membership.chatId);

  const groupChatIds = memberships
    .filter((membership) => membership.chat.isGroup)
    .map((membership) => membership.chatId);

  if (directChatIds.length > 0) {
    await tx.chatParticipant.updateMany({
      where: {
        userId: user.id,
        chatId: { in: directChatIds },
      },
      data: {
        username: user.username,
        email: user.email,
        userRole: user.role,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isDeletedAccount: true,
        deletedAt: now,
        chatRetentionUntil: retentionDeadline,
      },
    });

    await tx.chat.updateMany({
      where: { id: { in: directChatIds } },
      data: { updatedAt: now },
    });
  }

  if (groupChatIds.length > 0) {
    await tx.chatParticipant.updateMany({
      where: {
        userId: user.id,
        chatId: { in: groupChatIds },
      },
      data: {
        username: user.username,
        email: user.email,
        userRole: user.role,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isDeletedAccount: true,
        deletedAt: now,
        chatRetentionUntil: null,
      },
    });
  }

  return retentionDeadline;
};

export const hardDeleteUserAccount = async (userId: string) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        bio: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return null;
    }

    const retentionDeadline = await applyDeletedAccountSnapshot(tx, user);

    await tx.user.delete({
      where: { id: userId },
    });

    return {
      id: user.id,
      username: user.username,
      chatRetentionUntil: retentionDeadline,
    };
  });
};

export const purgeExpiredRestrictedChats = async () => {
  const expiredParticipants = await prisma.chatParticipant.findMany({
    where: {
      isDeletedAccount: true,
      chatRetentionUntil: { lte: new Date() },
      chat: { isGroup: false },
    },
    select: { chatId: true },
  });

  const expiredChatIds = Array.from(new Set(expiredParticipants.map((participant) => participant.chatId)));
  if (expiredChatIds.length === 0) {
    return 0;
  }

  const result = await prisma.chat.deleteMany({
    where: {
      id: { in: expiredChatIds },
    },
  });

  return result.count;
};
