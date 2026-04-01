import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hardDeleteUserAccount } from "@/lib/account-restrictions";

type RegisterPayload = {
  email?: string;
  password?: string;
  username?: string;
  role?: string;
  ownerKey?: string;
  course?: string;
  branch?: string;
  section?: string;
  year?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterPayload;
    const email = body.email?.trim();
    const password = body.password;
    const usernameInput = body.username?.trim();
    const roleInput = body.role?.toUpperCase();
    const courseInput = body.course?.trim() || "";
    const branchInput = body.branch?.trim() || "";
    const sectionInput = body.section?.trim() || "";
    const yearInput = body.year?.trim() || "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    const role = Object.values(Role).includes(roleInput as Role)
      ? (roleInput as Role)
      : Role.STUDENT;

    if ((role === Role.TEACHER || role === Role.ADMIN) && body.ownerKey?.trim() !== "337") {
      return NextResponse.json(
        { error: "Owner key required to create teacher/admin account" },
        { status: 403 }
      );
    }

    if (role === Role.STUDENT) {
      if (!courseInput || !branchInput || !sectionInput || !yearInput) {
        return NextResponse.json(
          { error: "Course, branch, section, and year are required for student accounts" },
          { status: 400 }
        );
      }

      const selectedCourse = await prisma.courseOption.findUnique({
        where: { value: courseInput },
        include: {
          branches: {
            include: { sections: true },
          },
          years: true,
        },
      });

      if (!selectedCourse) {
        return NextResponse.json({ error: "Selected course is invalid" }, { status: 400 });
      }

      const selectedBranch = selectedCourse.branches.find(
        (item) => item.value.trim().toLowerCase() === branchInput.toLowerCase()
      );
      if (!selectedBranch) {
        return NextResponse.json({ error: "Selected branch is invalid" }, { status: 400 });
      }

      const selectedSection = selectedBranch.sections.find(
        (item) => item.value.trim().toLowerCase() === sectionInput.toLowerCase()
      );
      if (!selectedSection) {
        return NextResponse.json({ error: "Selected section is invalid" }, { status: 400 });
      }

      const selectedYear = selectedCourse.years.find(
        (item) => item.value.trim().toLowerCase() === yearInput.toLowerCase()
      );
      if (!selectedYear) {
        return NextResponse.json({ error: "Selected year is invalid" }, { status: 400 });
      }

      body.course = selectedCourse.value;
      body.branch = selectedBranch.value;
      body.section = selectedSection.value;
      body.year = selectedYear.value;
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.restrictedAt) {
        await hardDeleteUserAccount(existing.id);
      } else {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 409 }
        );
      }
    }

    const username = usernameInput && usernameInput.length > 0
      ? usernameInput
      : email.split("@")[0];

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role,
        ...(role === Role.STUDENT
          ? {
              course: body.course,
              branch: body.branch,
              section: body.section,
              year: body.year,
            }
          : {}),
      },
    });

    return NextResponse.json({
      message: "Account created",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        course: user.course,
        branch: user.branch,
        section: user.section,
        year: user.year,
      },
    });
  } catch (err) {
    console.error("REGISTER API CRASH:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
