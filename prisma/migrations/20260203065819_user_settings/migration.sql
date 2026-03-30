-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "notifyEmailAnnouncements" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyEmailDigest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyPushComments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyPushMessages" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyPushPosts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "theme" TEXT;
