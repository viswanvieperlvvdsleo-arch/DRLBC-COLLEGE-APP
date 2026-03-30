/*
  Warnings:

  - You are about to drop the column `userid` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- DropIndex
DROP INDEX "User_userid_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "userid";
