import { useCallback, useEffect, useState } from "react";
import type { PushDevice } from "@/types/db";
import { env } from "@/lib/env";
import { repo } from "@/lib/repo";
import {
  notificationSupport,
  requestNotificationPermission,
  showTestNotification,
  type PermissionState,
} from "@/lib/notify";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export type PushStatus = {
  permission: PermissionState;
  devices: PushDevice[];
  subscribed: boolean;
  realPush: boolean;
  busy: boolean;
  error: string | null;
};

/**
 * Enables notifications on this device.
 *  - VAPID key configured → a real push subscription is stored; the Edge
 *    Function delivers alerts even when the browser is closed.
 *  - No key (demo) → we still ask permission and register a local device, so the
 *    whole UX, the device list and test notifications work end to end.
 */
export function usePush() {
  const [permission, setPermission] = useState<PermissionState>(() => notificationSupport());
  const [devices, setDevices] = useState<PushDevice[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  const realPush = Boolean(env.vapidPublicKey);

  const load = useCallback(async () => {
    try {
      const list = await repo().listPushDevices();
      setDevices(list);
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        setSubscribed(Boolean(sub));
      }
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result !== "granted") {
        setError(
          result === "denied"
            ? "Notifications are blocked in your browser settings for this site."
            : "Notification permission was not granted.",
        );
        return;
      }

      if (realPush) {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        const subscription =
          existing ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(env.vapidPublicKey) as BufferSource,
          }));
        await repo().savePushSubscription(subscription.toJSON());
        setSubscribed(true);
      } else {
        await repo().savePushSubscription({
          endpoint: `local:${navigator.userAgent.slice(0, 48)}:${Date.now()}`,
        });
        setSubscribed(true);
      }

      await load();
      await showTestNotification();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enable notifications");
    } finally {
      setBusy(false);
    }
  }, [load, realPush]);

  const disable = useCallback(
    async (deviceId: string) => {
      setBusy(true);
      try {
        await repo().removePushDevice(deviceId);
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          const sub = await reg?.pushManager.getSubscription();
          await sub?.unsubscribe();
        }
        setSubscribed(false);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not remove that device");
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const test = useCallback(async () => {
    await showTestNotification();
  }, []);

  return { permission, devices, subscribed, realPush, busy, error, enable, disable, test, reload: load };
}
