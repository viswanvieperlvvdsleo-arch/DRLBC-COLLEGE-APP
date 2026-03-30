-- CreateEnum
CREATE TYPE "NoteVisibility" AS ENUM ('CLASS_ONLY', 'VIEW_ALL');

-- DropIndex
DROP INDEX "Note_course_branch_year_subject_createdAt_idx";

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "section" TEXT,
ADD COLUMN     "visibility" "NoteVisibility" NOT NULL DEFAULT 'VIEW_ALL';

-- CreateIndex
CREATE INDEX "Note_visibility_course_branch_section_year_subject_createdA_idx" ON "Note"("visibility", "course", "branch", "section", "year", "subject", "createdAt");
