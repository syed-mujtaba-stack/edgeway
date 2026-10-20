// Supabase Edge Function: notify-inquiry
// NOTE: keep the npm: specifier for supabase-js — jsr: fails to boot on Edge Runtime 1.77.
//
// Called by the `on_inquiry_created` Postgres trigger for every new lead.
// Fans out a Web Push (VAPID) notification to every registered admin device,
// prunes dead subscriptions, and (optionally) sends an email copy.
//
// Secrets to set (Dashboard → Edge Functions → Secrets, or `supabase secrets set`):
//   VAPID_PUBLIC_KEY      — npx web-push generate-vapid-keys
//   VAPID_PRIVATE_KEY     — keep private, never in the frontend
//   VAPID_SUBJECT         — mailto:info@edgewaysecurity.com
//   NOTIFY_SECRET         — shared with the DB trigger (x-notify-secret header)
//   RESEND_API_KEY        — optional, for the email copy
//   NOTIFY_EMAIL          — optional, where the email copy goes
//
// Deploy:  supabase functions deploy notify-inquiry --no-verify-jwt

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type Payload = {
  type?: string;
  record?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    site_type: string | null;
    location: string | null;
    services: string[] | null;
    message: string | null;
  };
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const sharedSecret = Deno.env.get("NOTIFY_SECRET");
  if (sharedSecret && req.headers.get("x-notify-secret") !== sharedSecret) {
    return json({ error: "unauthorised" }, 401);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const record = payload.record;
  if (!record?.id) return json({ error: "no record" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, device");
  if (error) return json({ error: error.message }, 500);

  if (!subscriptions?.length) {
    await supabase.from("audit_log").insert({
      action: "push.skipped",
      entity: `inquiries:${record.id}`,
      meta: { reason: "no devices" },
    });
    return json({ sent: 0, reason: "no devices" });
  }

  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT") ?? "mailto:info@edgewaysecurity.com",
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!,
  );

  const services = (record.services ?? []).join(", ") || "Not sure yet";
  const notification = {
    title: `New quote request — ${record.name}`,
    body: [record.site_type, record.location, record.phone].filter(Boolean).join(" · ") +
      `\n${services}`,
    url: `/admin/inquiries/${record.id}`,
    tag: `inquiry-${record.id}`,
  };

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(notification),
        { TTL: 3600, urgency: "high" },
      ),
    ),
  );

  const dead: number[] = [];
  const ok: number[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      ok.push(subscriptions[index].id);
      return;
    }
    const statusCode = (result.reason as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) dead.push(subscriptions[index].id);
  });

  if (dead.length) {
    await supabase.from("push_subscriptions").delete().in("id", dead);
  }
  if (ok.length) {
    await supabase
      .from("push_subscriptions")
      .update({ last_ok_at: new Date().toISOString() })
      .in("id", ok);
  }

  // Optional email copy — never blocks the push result.
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const notifyEmail = Deno.env.get("NOTIFY_EMAIL");
  if (resendKey && notifyEmail) {
    const lines = [
      `Name: ${record.name}`,
      `Phone: ${record.phone}`,
      `Email: ${record.email}`,
      `Services: ${services}`,
      `Site type: ${record.site_type ?? "—"}`,
      `Location: ${record.location ?? "—"}`,
      "",
      record.message ?? "(no message)",
    ].join("\n");

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Edgeway Website <alerts@edgewaysecurity.com>",
        to: [notifyEmail],
        subject: `New quote request — ${record.name} (${record.site_type ?? "site"})`,
        text: lines,
      }),
    }).catch(() => undefined);
  }

  await supabase.from("audit_log").insert({
    action: "push.sent",
    entity: `inquiries:${record.id}`,
    meta: { sent: ok.length, dead: dead.length },
  });

  return json({ sent: ok.length, removed: dead.length, total: subscriptions.length });
});
