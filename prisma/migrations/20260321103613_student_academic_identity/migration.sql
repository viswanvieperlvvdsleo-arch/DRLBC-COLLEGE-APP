-- AlterTable
ALTER TABLE "User" ADD COLUMN     "branch" TEXT,
ADD COLUMN     "course" TEXT,
ADD COLUMN     "section" TEXT,
ADD COLUMN     "year" TEXT;

-- CreateIndex
CREATE INDEX "User_role_course_branch_year_section_idx" ON "User"("role", "course", "branch", "year", "section");
