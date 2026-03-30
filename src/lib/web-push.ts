import { prisma } from "@/lib/prisma";
import webpush from "web-push";

type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
  icon?: string;
  badge?: string;
};

const publicKey = process.env.WEB_PUSH_PUBLIC_KEY || "";
const privateKey = process.env.WEB_PUSH_PRIVATE_KEY || "";
const subject = process.env.WEB_PUSH_SUBJECT || "mailto:admin@drlbcollege.local";

let isConfigured = false;

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
  isConfigured = true;
}

const defaultIcon = "/icons/clg_icon_192.png";
const defaultBadge = "/icons/clg_icon_64.png";

export const isWebPushConfigured = () => isConfigured;

export const getPublicVapidKey = () => publicKey;

const buildPayload = (payload: PushPayload) =>
  JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    tag: payload.tag || "drlb-notification",
    icon: payload.icon || defaultIcon,
    badge: payload.badge || defaultBadge,
  });

export async function sendWebPushToUsers(userIds: string[], payload: PushPayload) {
  if (!isConfigured || userIds.length === 0) return 0;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: Array.from(new Set(userIds)) } },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  });

  if (subscriptions.length === 0) return 0;

  const invalidIds: string[] = [];
  let delivered = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          buildPayload(payload)
        );
        delivered += 1;
      } catch (err: any) {
        const statusCode = Number(err?.statusCode || err?.status || 0);
        if (statusCode === 404 || statusCode === 410) {
          invalidIds.push(subscription.id);
          return;
        }

        console.error("WEB PUSH SEND FAILED:", err);
      }
    })
  );

  if (invalidIds.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: invalidIds } },
    });
  }

  return delivered;
}
