-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'LIKE';
ALTER TYPE "NotificationType" ADD VALUE 'REEL';
ALTER TYPE "NotificationType" ADD VALUE 'NOTICE';
ALTER TYPE "NotificationType" ADD VALUE 'SCHEDULE';
ALTER TYPE "NotificationType" ADD VALUE 'NOTE';
ALTER TYPE "NotificationType" ADD VALUE 'INTERNSHIP';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyPushInternships" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyPushLikes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyPushNotes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyPushNotices" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyPushReels" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyPushSchedule" BOOLEAN NOT NULL DEFAULT true;
