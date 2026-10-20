/**
 * Notification helpers.
 *
 * In Supabase mode the real push comes from the Edge Function (works with the
 * browser closed). These helpers cover the parts the page owns:
 *   - permission requests
 *   - showing a notification through the service worker while the page is alive
 *     (this is what demo mode uses, and the fallback for desktop)
 */
import type { Inquiry } from "@/types/db";

export type PermissionState = "default" | "granted" | "denied" | "unsupported";

export function notificationSupport(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (!("serviceWorker" in navigator)) return "unsupported";
  return Notification.permission as PermissionState;
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  if (notificationSupport() === "unsupported") return "unsupported";
  const result = await Notification.requestPermission();
  return result as PermissionState;
}

async function show(title: string, body: string, url: string, tag?: string) {
  if (notificationSupport() !== "granted") return false;

  const options: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
    body,
    icon: "/assets/img/crest-96.png",
    badge: "/assets/img/crest-96.png",
    tag,
    data: { url },
    vibrate: [90, 40, 90],
    renotify: Boolean(tag),
  };

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, options);
    return true;
  } catch {
    try {
      new Notification(title, options);
      return true;
    } catch {
      return false;
    }
  }
}

export function showInquiryNotification(inquiry: Inquiry) {
  const bits = [
    inquiry.siteType ?? "Website enquiry",
    inquiry.location ?? null,
    inquiry.phone,
  ].filter(Boolean);
  return show(
    `New quote request — ${inquiry.name}`,
    `${bits.join(" · ")}\n${inquiry.services.join(", ") || "Not sure yet"}`,
    `/admin/inquiries/${inquiry.id}`,
    `inquiry-${inquiry.id}`,
  );
}

export function showTestNotification() {
  return show(
    "Edgeway admin — test notification",
    "If you can see this, notifications on this device are working.",
    "/admin/notifications",
    "test",
  );
}
