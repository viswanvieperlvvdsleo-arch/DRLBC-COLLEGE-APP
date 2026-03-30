-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyNcc" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyNss" BOOLEAN NOT NULL DEFAULT false;
