"use client";

import { createClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(adminId: string): Promise<void> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) throw new Error("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Este navegador no soporta notificaciones push.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permiso de notificaciones no concedido.");
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }

  const json = subscription.toJSON();
  const supabase = createClient();
  await supabase.from("push_subscriptions").upsert(
    {
      admin_id: adminId,
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh,
      auth: json.keys!.auth,
    },
    { onConflict: "endpoint" }
  );
}

export async function getPushSubscriptionStatus(): Promise<
  "unsupported" | "granted" | "denied" | "default"
> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}
