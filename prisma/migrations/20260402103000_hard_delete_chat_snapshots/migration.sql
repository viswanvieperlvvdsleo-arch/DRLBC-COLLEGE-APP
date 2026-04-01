ALTER TABLE "ChatParticipant"
ADD COLUMN "username" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "userRole" TEXT,
ADD COLUMN "bio" TEXT,
ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "isDeletedAccount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "chatRetentionUntil" TIMESTAMP(3);

UPDATE "ChatParticipant" AS cp
SET
  "username" = u."username",
  "email" = u."email",
  "userRole" = u."role"::text,
  "bio" = u."bio",
  "avatarUrl" = u."avatarUrl"
FROM "User" AS u
WHERE cp."userId" = u."id";

ALTER TABLE "ChatParticipant"
ALTER COLUMN "username" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "userRole" SET NOT NULL;

ALTER TABLE "ChatParticipant" DROP CONSTRAINT IF EXISTS "ChatParticipant_userId_fkey";
ALTER TABLE "ChatMessage" DROP CONSTRAINT IF EXISTS "ChatMessage_senderId_fkey";

CREATE INDEX "ChatParticipant_isDeletedAccount_chatRetentionUntil_idx"
ON "ChatParticipant"("isDeletedAccount", "chatRetentionUntil");
