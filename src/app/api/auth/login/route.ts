import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const normalize = (value: unknown) => String(value || "").trim().toLowerCase();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email, password, course, branch, section, year } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (user.role === "STUDENT") {
      if (!course || !branch || !section || !year) {
        return NextResponse.json(
          { error: "Choose your course, branch, section, and year to log in." },
          { status: 400 }
        );
      }

      if (!user.course || !user.branch || !user.section || !user.year) {
        return NextResponse.json(
          { error: "Your academic profile is incomplete. Please contact a teacher." },
          { status: 403 }
        );
      }

      const matchesCurrentAcademicProfile =
        normalize(user.course) === normalize(course) &&
        normalize(user.branch) === normalize(branch) &&
        normalize(user.section) === normalize(section) &&
        normalize(user.year) === normalize(year);

      if (!matchesCurrentAcademicProfile) {
        const matchesPendingAcademicProfile =
          user.pendingCourse &&
          user.pendingBranch &&
          user.pendingSection &&
          user.pendingYear &&
          normalize(user.pendingCourse) === normalize(course) &&
          normalize(user.pendingBranch) === normalize(branch) &&
          normalize(user.pendingSection) === normalize(section) &&
          normalize(user.pendingYear) === normalize(year);

        return NextResponse.json(
          {
            error: matchesPendingAcademicProfile
              ? "Your academic update is still pending. Log in once with your previous batch details, then tap update and continue."
              : "Academic details do not match your active student profile.",
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        course: user.course,
        branch: user.branch,
        section: user.section,
        year: user.year,
        pendingCourse: user.pendingCourse,
        pendingBranch: user.pendingBranch,
        pendingSection: user.pendingSection,
        pendingYear: user.pendingYear,
      },
    });
  } catch (err) {
    console.error("LOGIN API CRASH:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
