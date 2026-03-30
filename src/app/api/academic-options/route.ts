import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, getUserOrError, requireTeacherOrError } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaultData = {
  courses: [
    { value: "btech-eng", label: "Engineering (B.Tech)" },
    { value: "bsc", label: "B.Sc." },
    { value: "ba", label: "B.A." },
    { value: "bba", label: "B.B.A." },
    { value: "bcom", label: "B.Com." },
  ],
  branches: {
    "btech-eng": [
      { value: "cse", label: "CSE" },
      { value: "me", label: "ME" },
      { value: "ce", label: "CE" },
      { value: "ee", label: "EE" },
      { value: "ece", label: "ECE" },
      { value: "it", label: "IT" },
      { value: "che", label: "ChE" },
      { value: "eee", label: "EEE" },
    ],
    "bsc": [
      { value: "cs", label: "Computer Science" },
      { value: "ds", label: "Data Science" },
      { value: "ls", label: "Life Science" },
      { value: "ps", label: "Physical Science" },
    ],
    "ba": [
      { value: "history", label: "History" },
      { value: "pol-sci", label: "Political Science" },
      { value: "eng-lit", label: "English Literature" },
      { value: "sociology", label: "Sociology" },
      { value: "psychology", label: "Psychology" },
      { value: "economics", label: "Economics" },
    ],
    "bba": [
      { value: "finance", label: "Finance" },
      { value: "marketing", label: "Marketing" },
      { value: "hrm", label: "Human Resource Management" },
      { value: "intl-biz", label: "International Business" },
      { value: "entrepreneurship", label: "Entrepreneurship" },
    ],
    "bcom": [
      { value: "acc-fin", label: "Accounting and Finance" },
      { value: "taxation", label: "Taxation" },
      { value: "banking-ins", label: "Banking and Insurance" },
      { value: "e-comm", label: "E-commerce" },
      { value: "corp-sec", label: "Corporate Secretaryship" },
    ],
  },
  years: [
    { value: "1-1", label: "1st year sem 1" },
    { value: "1-2", label: "1st year sem-2" },
    { value: "2-3", label: "2nd year sem 3" },
    { value: "2-4", label: "2nd year sem-4" },
    { value: "3-5", label: "3rd year sem 5" },
    { value: "3-6", label: "3rd year sem-6" },
    { value: "4-7", label: "4th year sem 7" },
    { value: "4-8", label: "4th year sem-8" },
  ],
  sections: [
    { value: "cs1", label: "CS1" },
    { value: "cs2", label: "CS2" },
    { value: "cs3", label: "CS3" },
    { value: "cs4", label: "CS4" },
    { value: "cs5", label: "CS5" },
  ],
};

async function ensureSeeded() {
  const count = await prisma.courseOption.count();
  if (count > 0) return;

  await prisma.$transaction(async (tx) => {
    for (const course of defaultData.courses) {
      const createdCourse = await tx.courseOption.create({ data: course });
      const branches = defaultData.branches[course.value] ?? [];
      for (const br of branches) {
        const createdBranch = await tx.branchOption.create({
          data: { ...br, courseId: createdCourse.id },
        });
        for (const sec of defaultData.sections) {
          await tx.sectionOption.create({
            data: { ...sec, branchId: createdBranch.id },
          });
        }
      }
      for (const yr of defaultData.years) {
        await tx.yearOption.create({
          data: { ...yr, courseId: createdCourse.id },
        });
      }
    }
  });
}

export async function GET() {
  try {
    await ensureSeeded();
    const [courses, students] = await Promise.all([
      prisma.courseOption.findMany({
        include: {
          branches: { include: { sections: true }, orderBy: { id: "asc" } },
          years: { orderBy: { id: "asc" } },
        },
        orderBy: { id: "asc" },
      }),
      prisma.user.findMany({
        where: { role: "STUDENT" },
        select: { course: true, branch: true, section: true, year: true },
      }),
    ]);

    const coursesWithCounts = courses.map((course) => ({
      ...course,
      accountCount: students.filter((student) => student.course === course.value).length,
      branches: course.branches.map((branch) => ({
        ...branch,
        accountCount: students.filter(
          (student) => student.course === course.value && student.branch === branch.value
        ).length,
        sections: branch.sections.map((section) => ({
          ...section,
          accountCount: students.filter(
            (student) =>
              student.course === course.value &&
              student.branch === branch.value &&
              student.section === section.value
          ).length,
        })),
      })),
      years: course.years.map((year) => ({
        ...year,
        accountCount: students.filter(
          (student) => student.course === course.value && student.year === year.value
        ).length,
      })),
    }));

    return NextResponse.json({ courses: coursesWithCounts });
  } catch (err) {
    console.error("ACADEMIC OPTIONS GET CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

type AddPayload = {
  type: "course" | "branch" | "section" | "year";
  courseValue?: string;
  branchValue?: string;
  value: string;
  label: string;
  userId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AddPayload;
    const userId = body.userId?.trim();
    const type = body.type;
    const value = body.value?.trim();
    const label = body.label?.trim();
    const courseValue = body.courseValue?.trim();
    const branchValue = body.branchValue?.trim();
    if (!userId) return apiError("Missing userId", 400);
    if (!type || !value || !label) return apiError("Missing required fields", 400);

    const { user, error } = await getUserOrError(userId);
    if (error) return error;
    const roleError = requireTeacherOrError(user.role, "Only faculty can manage options");
    if (roleError) return roleError;

    if (type === "course") {
      const created = await prisma.courseOption.create({ data: { value, label } });
      return NextResponse.json({ created });
    }

    const course = await prisma.courseOption.findUnique({ where: { value: courseValue ?? "" } });
    if (!course) return apiError("Course not found", 404);

    if (type === "branch") {
      const created = await prisma.branchOption.create({ data: { value, label, courseId: course.id } });
      return NextResponse.json({ created });
    }

    if (type === "year") {
      const created = await prisma.yearOption.create({ data: { value, label, courseId: course.id } });
      return NextResponse.json({ created });
    }

    if (type === "section") {
      const branch = await prisma.branchOption.findFirst({ where: { value: branchValue ?? "", courseId: course.id } });
      if (!branch) return apiError("Branch not found", 404);
      const created = await prisma.sectionOption.create({ data: { value, label, branchId: branch.id } });
      return NextResponse.json({ created });
    }

    return apiError("Invalid type", 400);
  } catch (err) {
    console.error("ACADEMIC OPTIONS POST CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId")?.trim();
    const type = url.searchParams.get("type") as "course" | "branch" | "section" | "year" | null;
    const id = Number(url.searchParams.get("id"));
    if (!userId || !type || Number.isNaN(id)) return apiError("Missing params", 400);

    const { user, error } = await getUserOrError(userId);
    if (error) return error;
    const roleError = requireTeacherOrError(user.role, "Only faculty can manage options");
    if (roleError) return roleError;

    let deleted = 0;
    if (type === "course") {
      deleted = (await prisma.courseOption.deleteMany({ where: { id } })).count;
    } else if (type === "branch") {
      deleted = (await prisma.branchOption.deleteMany({ where: { id } })).count;
    } else if (type === "section") {
      deleted = (await prisma.sectionOption.deleteMany({ where: { id } })).count;
    } else if (type === "year") {
      deleted = (await prisma.yearOption.deleteMany({ where: { id } })).count;
    }

    if (!deleted) return apiError("Not found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ACADEMIC OPTIONS DELETE CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
