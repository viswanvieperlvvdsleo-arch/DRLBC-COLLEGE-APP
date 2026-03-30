self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (error) {
    console.error("Failed to parse push payload", error);
    return;
  }

  const title = payload.title || "DR.LB College";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/clg_icon_192.png",
    badge: payload.badge || "/icons/clg_icon_64.png",
    tag: payload.tag || "drlb-notification",
    data: {
      url: payload.url || "/home",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/home";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("navigate" in client && "focus" in client) {
          return client.navigate(targetUrl).then(() => client.focus());
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
