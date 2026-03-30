import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-utils";
import { RegistrationGroup, RegistrationStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const group = url.searchParams.get("group")?.toUpperCase();
    const allowedGroups = ["NSS", "NCC"];
    const filterGroup = allowedGroups.includes(group || "") ? (group as RegistrationGroup) : undefined;

    const regs = await prisma.registration.findMany({
      where: filterGroup ? { group: filterGroup } : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      registrations: regs.map((r) => ({
        id: r.id,
        applicantId: r.applicantId,
        applicantUsername: r.applicantUsername,
        fullName: r.fullName,
        mobile: r.mobile,
        group: r.group,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("REGISTRATIONS GET CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      applicantId?: string;
      applicantUsername?: string;
      fullName?: string;
      mobile?: string;
      group?: string;
    };

    const applicantId = body.applicantId?.trim() || "";
    const applicantUsername = body.applicantUsername?.trim() || "";
    const fullName = body.fullName?.trim() || "";
    const mobile = body.mobile?.trim() || "";
    const groupRaw = body.group?.toUpperCase();

    if (!applicantId || !fullName || !mobile || !groupRaw) {
      return apiError("Missing required fields", 400);
    }
    if (!["NSS", "NCC"].includes(groupRaw)) {
      return apiError("Invalid group", 400);
    }

    const created = await prisma.registration.create({
      data: {
        applicantId,
        applicantUsername: applicantUsername || "unknown",
        fullName,
        mobile,
        group: groupRaw as RegistrationGroup,
      },
    });

    return NextResponse.json(
      {
        registration: {
          id: created.id,
          applicantId: created.applicantId,
          applicantUsername: created.applicantUsername,
          fullName: created.fullName,
          mobile: created.mobile,
          group: created.group,
          status: created.status,
          createdAt: created.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("REGISTRATIONS POST CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: string;
      reviewerId?: string;
      status?: string;
    };
    const id = body.id?.trim() || "";
    const reviewerId = body.reviewerId?.trim() || "";
    const statusRaw = body.status?.toUpperCase() || "";

    if (!id || !reviewerId || !["APPROVED", "DENIED"].includes(statusRaw)) {
      return apiError("Missing or invalid fields", 400);
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: {
        status: statusRaw as RegistrationStatus,
        reviewerId,
      },
    });

    return NextResponse.json({
      registration: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("REGISTRATIONS PATCH CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
