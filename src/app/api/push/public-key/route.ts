import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-utils";
import { getPublicVapidKey, isWebPushConfigured } from "@/lib/web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isWebPushConfigured()) {
    return apiError("Web push is not configured on this server", 503);
  }

  return NextResponse.json({ publicKey: getPublicVapidKey() });
}
