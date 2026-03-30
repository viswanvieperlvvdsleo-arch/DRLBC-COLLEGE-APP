-- CreateEnum
CREATE TYPE "ScheduleCategory" AS ENUM ('TIMETABLE', 'ATTENDANCE', 'RESULTS');

-- CreateTable
CREATE TABLE "ScheduleFile" (
    "id" TEXT NOT NULL,
    "category" "ScheduleCategory" NOT NULL,
    "course" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "isImage" BOOLEAN NOT NULL DEFAULT false,
    "uploaderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleFile_category_course_branch_year_createdAt_idx" ON "ScheduleFile"("category", "course", "branch", "year", "createdAt");

-- CreateIndex
CREATE INDEX "ScheduleFile_uploaderId_createdAt_idx" ON "ScheduleFile"("uploaderId", "createdAt");

-- AddForeignKey
ALTER TABLE "ScheduleFile" ADD CONSTRAINT "ScheduleFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
