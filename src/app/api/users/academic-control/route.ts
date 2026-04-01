import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, createNotificationsAndPush, getUserOrError, requireTeacherOrError } from "@/lib/api-utils";

type AcademicBatch = {
  course: string;
  branch: string;
  section: string;
  year: string;
};

const normalize = (value: unknown) => String(value || "").trim();
const normalizeKey = (value: unknown) => normalize(value).toLowerCase();

const parseBatch = (input: unknown): AcademicBatch => {
  const batch = (input ?? {}) as Record<string, unknown>;
  return {
    course: normalize(batch.course),
    branch: normalize(batch.branch),
    section: normalize(batch.section),
    year: normalize(batch.year),
  };
};

const isCompleteBatch = (batch: AcademicBatch) =>
  Boolean(batch.course && batch.branch && batch.section && batch.year);

const matchesBatch = (
  student: {
    course: string | null;
    branch: string | null;
    section: string | null;
    year: string | null;
  },
  batch: AcademicBatch
) =>
  normalizeKey(student.course) === normalizeKey(batch.course) &&
  normalizeKey(student.branch) === normalizeKey(batch.branch) &&
  normalizeKey(student.section) === normalizeKey(batch.section) &&
  normalizeKey(student.year) === normalizeKey(batch.year);

const mapStudent = (student: {
  id: string;
  username: string;
  email: string;
  course: string | null;
  branch: string | null;
  section: string | null;
  year: string | null;
}) => ({
  id: student.id,
  username: student.username,
  email: student.email,
  course: student.course,
  branch: student.branch,
  section: student.section,
  year: student.year,
});

async function validateAcademicBatch(batch: AcademicBatch) {
  const courses = await prisma.courseOption.findMany({
    include: {
      branches: { include: { sections: true } },
      years: true,
    },
  });

  const course = courses.find((item) => normalizeKey(item.value) === normalizeKey(batch.course));

  if (!course) {
    return { error: apiError("Selected course is invalid", 400) };
  }

  const branch = course.branches.find((item) => normalizeKey(item.value) === normalizeKey(batch.branch));
  if (!branch) {
    return { error: apiError("Selected branch is invalid", 400) };
  }

  const section = branch.sections.find((item) => normalizeKey(item.value) === normalizeKey(batch.section));
  if (!section) {
    return { error: apiError("Selected section is invalid", 400) };
  }

  const year = course.years.find((item) => normalizeKey(item.value) === normalizeKey(batch.year));
  if (!year) {
    return { error: apiError("Selected year is invalid", 400) };
  }

  return {
    error: null as const,
    resolved: {
      course: course.value,
      branch: branch.value,
      section: section.value,
      year: year.value,
    } satisfies AcademicBatch,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = normalize(url.searchParams.get("userId"));
    const batch = parseBatch({
      course: url.searchParams.get("course"),
      branch: url.searchParams.get("branch"),
      section: url.searchParams.get("section"),
      year: url.searchParams.get("year"),
    });

    if (!userId) return apiError("Missing userId", 400);
    if (!isCompleteBatch(batch)) return apiError("Source batch is incomplete", 400);

    const { user, error } = await getUserOrError(userId);
    if (error) return error;

    const roleError = requireTeacherOrError(user.role, "Only teachers can manage academic batches");
    if (roleError) return roleError;

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        restrictedAt: null,
      },
      orderBy: { username: "asc" },
      select: {
        id: true,
        username: true,
        email: true,
        course: true,
        branch: true,
        section: true,
        year: true,
      },
      take: 500,
    });

    const matchedStudents = students.filter((student) => matchesBatch(student, batch));

    return NextResponse.json({
      count: matchedStudents.length,
      students: matchedStudents.map(mapStudent),
    });
  } catch (err) {
    console.error("ACADEMIC CONTROL GET CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const userId = normalize(body.userId);
    const targetStudentId = normalize(body.targetStudentId);
    const target = parseBatch(body.target);

    if (!userId || !targetStudentId) return apiError("Missing userId or targetStudentId", 400);
    if (!isCompleteBatch(target)) return apiError("Target batch is incomplete", 400);

    const { user, error } = await getUserOrError(userId);
    if (error) return error;

    const roleError = requireTeacherOrError(user.role, "Only teachers can promote individual student accounts");
    if (roleError) return roleError;

    const targetStudent = await prisma.user.findUnique({
      where: { id: targetStudentId },
      select: {
        id: true,
        username: true,
        role: true,
        restrictedAt: true,
        course: true,
        branch: true,
        section: true,
        year: true,
      },
    });

    if (!targetStudent) return apiError("Student account not found", 404);
    if (targetStudent.role !== "STUDENT") return apiError("Only student accounts can be promoted here", 403);
    if (targetStudent.restrictedAt) return apiError("Restricted student accounts cannot be promoted", 409);

    if (!isCompleteBatch(parseBatch(targetStudent))) {
      return apiError("The selected student does not have a complete academic profile", 400);
    }

    const validation = await validateAcademicBatch(target);
    if (validation.error) return validation.error;
    const resolvedTarget = validation.resolved;

    const alreadyCurrent =
      normalizeKey(targetStudent.course) === normalizeKey(resolvedTarget.course) &&
      normalizeKey(targetStudent.branch) === normalizeKey(resolvedTarget.branch) &&
      normalizeKey(targetStudent.section) === normalizeKey(resolvedTarget.section) &&
      normalizeKey(targetStudent.year) === normalizeKey(resolvedTarget.year);

    if (alreadyCurrent) {
      return apiError("Choose a new batch before sending the promotion update", 400);
    }

    const updated = await prisma.user.update({
      where: { id: targetStudentId },
      data: {
        pendingCourse: resolvedTarget.course,
        pendingBranch: resolvedTarget.branch,
        pendingSection: resolvedTarget.section,
        pendingYear: resolvedTarget.year,
      },
      select: {
        id: true,
        username: true,
        course: true,
        branch: true,
        section: true,
        year: true,
        pendingCourse: true,
        pendingBranch: true,
        pendingSection: true,
        pendingYear: true,
      },
    });

    await createNotificationsAndPush({
      userIds: [targetStudentId],
      type: "NOTICE",
      title: "Academic profile update pending",
      description: `${user.username} updated your academic batch. Log in with your current batch, then tap update and continue.`,
      link: "/home",
      actorName: user.username,
      actorAvatar: user.avatarUrl ?? null,
    });

    return NextResponse.json({
      message: "Pending academic update created",
      student: updated,
    });
  } catch (err) {
    console.error("ACADEMIC CONTROL POST CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const userId = normalize(body.userId);
    const source = parseBatch(body.source);
    const targetRaw = parseBatch(body.target);

    if (!userId) return apiError("Missing userId", 400);
    if (!isCompleteBatch(source)) return apiError("Source batch is incomplete", 400);

    const { user, error } = await getUserOrError(userId);
    if (error) return error;

    const roleError = requireTeacherOrError(user.role, "Only teachers can manage academic batches");
    if (roleError) return roleError;

    const target: AcademicBatch = {
      course: targetRaw.course || source.course,
      branch: targetRaw.branch || source.branch,
      section: targetRaw.section || source.section,
      year: targetRaw.year || source.year,
    };

    if (
      target.course === source.course &&
      target.branch === source.branch &&
      target.section === source.section &&
      target.year === source.year
    ) {
      return apiError("Choose at least one new academic value to apply", 400);
    }

    const validation = await validateAcademicBatch(target);
    if (validation.error) return validation.error;
    const resolvedTarget = validation.resolved;

    const matchingStudents = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        restrictedAt: null,
      },
      select: {
        id: true,
        course: true,
        branch: true,
        section: true,
        year: true,
      },
      take: 500,
    });

    const matchedStudents = matchingStudents.filter((student) => matchesBatch(student, source));

    if (matchedStudents.length === 0) {
      return apiError("No students found for the selected batch", 404);
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: matchedStudents.map((student) => student.id) } },
      data: {
        pendingCourse: resolvedTarget.course,
        pendingBranch: resolvedTarget.branch,
        pendingSection: resolvedTarget.section,
        pendingYear: resolvedTarget.year,
      },
    });

    await createNotificationsAndPush({
      userIds: matchedStudents.map((student) => student.id),
      type: "NOTICE",
      title: "Academic profile update pending",
      description: `${user.username} updated your academic batch. Log in with your current batch, then tap update and continue.`,
      link: "/home",
      actorName: user.username,
      actorAvatar: user.avatarUrl ?? null,
    });

    return NextResponse.json({
      updatedCount: result.count,
      source,
      target: resolvedTarget,
    });
  } catch (err) {
    console.error("ACADEMIC CONTROL PATCH CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
