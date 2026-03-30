import { NextResponse } from "next/server";
import { apiError, getUserOrError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { isWebPushConfigured } from "@/lib/web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionPayload = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

const parseSubscription = (value: unknown) => {
  const subscription = (value ?? {}) as SubscriptionPayload;
  const endpoint = String(subscription.endpoint || "").trim();
  const p256dh = String(subscription.keys?.p256dh || "").trim();
  const auth = String(subscription.keys?.auth || "").trim();
  return { endpoint, p256dh, auth };
};

export async function POST(req: Request) {
  try {
    if (!isWebPushConfigured()) {
      return apiError("Web push is not configured on this server", 503);
    }

    const body = (await req.json()) as { userId?: string; subscription?: SubscriptionPayload };
    const userId = String(body.userId || "").trim();
    if (!userId) return apiError("Missing userId", 400);

    const { error } = await getUserOrError(userId);
    if (error) return error;

    const subscription = parseSubscription(body.subscription);
    if (!subscription.endpoint || !subscription.p256dh || !subscription.auth) {
      return apiError("Invalid push subscription payload", 400);
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUSH SUBSCRIPTION POST CRASH:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { userId?: string; endpoint?: string };
    const userId = String(body.userId || "").trim();
    const endpoint = String(body.endpoint || "").trim();

    if (!userId || !endpoint) {
      return apiError("Missing userId or endpoint", 400);
    }

    await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUSH SUBSCRIPTION DELETE CRASH:", err);
    return apiError("Internal server error", 500);
  }
}
