-- DropIndex
DROP INDEX "ScheduleFile_category_course_branch_year_createdAt_idx";

-- AlterTable
ALTER TABLE "ScheduleFile" ADD COLUMN     "section" TEXT;

-- CreateTable
CREATE TABLE "CourseOption" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchOption" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionOption" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YearOption" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YearOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseOption_value_key" ON "CourseOption"("value");

-- CreateIndex
CREATE UNIQUE INDEX "BranchOption_courseId_value_key" ON "BranchOption"("courseId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "SectionOption_branchId_value_key" ON "SectionOption"("branchId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "YearOption_courseId_value_key" ON "YearOption"("courseId", "value");

-- CreateIndex
CREATE INDEX "ScheduleFile_category_course_branch_year_section_createdAt_idx" ON "ScheduleFile"("category", "course", "branch", "year", "section", "createdAt");

-- AddForeignKey
ALTER TABLE "BranchOption" ADD CONSTRAINT "BranchOption_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "CourseOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionOption" ADD CONSTRAINT "SectionOption_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "BranchOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YearOption" ADD CONSTRAINT "YearOption_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "CourseOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
