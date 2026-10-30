import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminUser,
  BusinessSettings,
  Inquiry,
  InquiryNote,
  NewInquiry,
  SiteImageRow,
} from "@/types/db";
import { imageSlots } from "@/data/imageSlots";
import { processImage } from "@/lib/imagePipeline";
import { getSupabase } from "@/lib/supabaseClient";
import type { Repo, RepoEvent, Unsubscribe } from "@/lib/repo/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const BUCKET = "site-images";

function mapNote(row: Row, author?: string): InquiryNote {
  return {
    id: String(row.id),
    body: String(row.body ?? ""),
    author: author ?? "Admin",
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapInquiry(row: Row): Inquiry {
  const notes = Array.isArray(row.inquiry_notes)
    ? [...row.inquiry_notes]
        .map((n: Row) => mapNote(n))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : [];
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    company: row.company ?? null,
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    services: Array.isArray(row.services) ? row.services : [],
    siteType: row.site_type ?? null,
    timing: row.timing ?? null,
    location: row.location ?? null,
    message: row.message ?? null,
    status: row.status ?? "new",
    isRead: Boolean(row.is_read),
    source: String(row.source ?? "website"),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    notes,
  };
}

function publicUrl(client: SupabaseClient, path: string | null): string | null {
  if (!path) return null;
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function mapImage(client: SupabaseClient, row: Row | undefined, slot: string): Promise<SiteImageRow> {
  const fallback = imageSlots.find((s) => s.key === slot);
  if (!row) {
    return {
      slot,
      src1200: null,
      src2400: null,
      width: null,
      height: null,
      alt: fallback?.defaultAlt ?? "",
      version: 0,
      updatedAt: new Date(0).toISOString(),
      updatedBy: null,
      history: [],
    };
  }

  const { data: historyRows } = await client
    .from("site_image_history")
    .select("id,storage_path,alt,created_at,created_by_name")
    .eq("slot", slot)
    .order("created_at", { ascending: false })
    .limit(8);

  return {
    slot,
    src1200: publicUrl(client, row.path_1200 ?? null),
    src2400: publicUrl(client, row.path_2400 ?? null),
    width: row.width ?? null,
    height: row.height ?? null,
    alt: row.alt ?? fallback?.defaultAlt ?? "",
    version: row.version ?? 0,
    updatedAt: row.updated_at ?? new Date(0).toISOString(),
    updatedBy: row.updated_by_name ?? null,
    history: (historyRows ?? []).map((h: Row) => ({
      id: String(h.id),
      url: publicUrl(client, h.storage_path) ?? "",
      alt: h.alt ?? "",
      createdAt: String(h.created_at),
      createdBy: h.created_by_name ?? "Admin",
    })),
  };
}

export function createSupabaseRepo(): Repo {
  const client = getSupabase();

  const requireUser = async (): Promise<AdminUser> => {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw new Error("Not signed in");
    const { data: profile, error: profileError } = await client
      .from("admins")
      .select("full_name,role")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError) throw new Error(`Could not verify admin profile: ${profileError.message}`);
    if (!profile) throw new Error("Your account is not authorized for the admin dashboard.");
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      name: (profile as Row).full_name ?? "Admin",
      role: ((profile as Row).role ?? "admin") as AdminUser["role"],
    };
  };

  return {
    mode: "supabase",

    /* auth ---------------------------------------------------------------- */
    async getSession() {
      const { data } = await client.auth.getSession();
      if (!data.session) return null;
      try {
        return await requireUser();
      } catch {
        return null;
      }
    },

    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(error.message);
      return requireUser();
    },

    async resetPassword(email) {
      const redirectTo = `${window.location.origin}/admin/profile?reset=1`;
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw new Error(error.message);
    },

    async updatePassword(password) {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw new Error(error.message);
    },

    async signOut() {
      await client.auth.signOut();
    },

    /* inquiries ----------------------------------------------------------- */
    async listInquiries() {
      const { data, error } = await client
        .from("inquiries")
        .select("*, inquiry_notes(*)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapInquiry);
    },

    async getInquiry(id) {
      const { data, error } = await client
        .from("inquiries")
        .select("*, inquiry_notes(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapInquiry(data) : null;
    },

    async createInquiry(input: NewInquiry) {
      const { data, error } = await client
        .from("inquiries")
        .insert({
          name: input.name,
          company: input.company || null,
          email: input.email,
          phone: input.phone,
          services: input.services,
          site_type: input.siteType || null,
          timing: input.timing || null,
          location: input.location || null,
          message: input.message || null,
          source: "website",
          submission_id: input.submissionId,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : null,
        })
        .select("*, inquiry_notes(*)")
        .single();
      if (error) throw new Error(error.message);
      return mapInquiry(data);
    },

    async updateInquiry(id, patch) {
      const { data, error } = await client
        .from("inquiries")
        .update({
          ...(patch.status ? { status: patch.status } : {}),
          ...(patch.isRead === undefined ? {} : { is_read: patch.isRead }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*, inquiry_notes(*)")
        .single();
      if (error) throw new Error(error.message);
      return mapInquiry(data);
    },

    async addNote(id, body) {
      const me = await requireUser();
      const { data, error } = await client
        .from("inquiry_notes")
        .insert({ inquiry_id: id, body: body.trim(), author_id: me.id, author_name: me.name })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return mapNote(data, me.name);
    },

    async deleteInquiry(id) {
      const { error } = await client.from("inquiries").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },

    async deleteInquiries(ids) {
      if (ids.length === 0) return;
      const { error } = await client.from("inquiries").delete().in("id", ids);
      if (error) throw new Error(error.message);
    },

    subscribeInquiries(cb: (event: RepoEvent) => void): Unsubscribe {
      const channel = client
        .channel("admin-inquiries")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "inquiries" },
          (payload) => {
            if (payload.eventType === "DELETE") {
              const old = payload.old as Row;
              if (old?.id) cb({ type: "delete", id: String(old.id) });
              return;
            }
            const inquiry = mapInquiry(payload.new as Row);
            cb({ type: payload.eventType === "INSERT" ? "insert" : "update", inquiry });
          },
        )
        .subscribe();

      return () => {
        void client.removeChannel(channel);
      };
    },

    /* images -------------------------------------------------------------- */
    async listImages() {
      const { data, error } = await client.from("site_images").select("*");
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Row[];
      return Promise.all(
        imageSlots.map((slot) => mapImage(client, rows.find((r) => r.slot === slot.key), slot.key)),
      );
    },

    async uploadImage(slot, file, alt) {
      const me = await requireUser();
      const processed = await processImage(file);
      const stamp = Date.now();

      const path2400 = `${slot}/${stamp}-2400.webp`;
      const path1200 = `${slot}/${stamp}-1200.webp`;

      const [up1, up2] = await Promise.all([
        client.storage.from(BUCKET).upload(path2400, processed.full, { contentType: "image/webp", upsert: true }),
        client.storage.from(BUCKET).upload(path1200, processed.small, { contentType: "image/webp", upsert: true }),
      ]);
      if (up1.error) throw new Error(up1.error.message);
      if (up2.error) throw new Error(up2.error.message);

      const { data: current } = await client
        .from("site_images")
        .select("version")
        .eq("slot", slot)
        .maybeSingle();
      const version = Number((current as Row | null)?.version ?? 0) + 1;

      const { error } = await client.from("site_images").upsert({
        slot,
        path_2400: path2400,
        path_1200: path1200,
        width: processed.width,
        height: processed.height,
        alt,
        version,
        updated_by: me.id,
        updated_by_name: me.name,
        updated_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);

      await client.from("site_image_history").insert({
        slot,
        storage_path: path2400,
        alt,
        created_by: me.id,
        created_by_name: me.name,
      });

      const { data: row } = await client.from("site_images").select("*").eq("slot", slot).maybeSingle();
      return mapImage(client, row as Row, slot);
    },

    async resetImage(slot) {
      const me = await requireUser();
      const { error } = await client
        .from("site_images")
        .update({
          path_2400: null,
          path_1200: null,
          width: null,
          height: null,
          alt: imageSlots.find((s) => s.key === slot)?.defaultAlt ?? "",
          updated_by: me.id,
          updated_by_name: me.name,
          updated_at: new Date().toISOString(),
        })
        .eq("slot", slot);
      if (error) throw new Error(error.message);
      const { data: row } = await client.from("site_images").select("*").eq("slot", slot).maybeSingle();
      return mapImage(client, row as Row, slot);
    },

    async restoreVersion(slot, versionId) {
      const me = await requireUser();
      const { data: history, error: historyError } = await client
        .from("site_image_history")
        .select("*")
        .eq("id", versionId)
        .single();
      if (historyError) throw new Error(historyError.message);
      const entry = history as Row;

      const smallPath = String(entry.storage_path).replace("-2400.webp", "-1200.webp");
      const { error } = await client
        .from("site_images")
        .update({
          path_2400: entry.storage_path,
          path_1200: smallPath,
          alt: entry.alt,
          updated_by: me.id,
          updated_by_name: me.name,
          updated_at: new Date().toISOString(),
        })
        .eq("slot", slot);
      if (error) throw new Error(error.message);

      await client.from("site_image_history").insert({
        slot,
        storage_path: entry.storage_path,
        alt: entry.alt,
        created_by: me.id,
        created_by_name: me.name,
      });

      const { data: row } = await client.from("site_images").select("*").eq("slot", slot).maybeSingle();
      return mapImage(client, row as Row, slot);
    },

    /* push ---------------------------------------------------------------- */
    async listPushDevices() {
      const { data, error } = await client
        .from("push_subscriptions")
        .select("id,device,endpoint,created_at,last_ok_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row: Row) => ({
        id: String(row.id),
        device: row.device ?? "Unknown device",
        endpoint: String(row.endpoint ?? "").slice(0, 80),
        createdAt: String(row.created_at),
        lastOkAt: row.last_ok_at ?? null,
      }));
    },

    async savePushSubscription(sub) {
      const me = await requireUser();
      const keys = sub.keys ?? {};
      const { data, error } = await client
        .from("push_subscriptions")
        .upsert(
          {
            admin_id: me.id,
            endpoint: sub.endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
            device: `${navigator.platform || "Device"} · ${navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop"}`,
            last_ok_at: new Date().toISOString(),
          },
          { onConflict: "endpoint" },
        )
        .select("id,device,endpoint,created_at,last_ok_at")
        .single();
      if (error) throw new Error(error.message);
      const row = data as Row;
      return {
        id: String(row.id),
        device: row.device ?? "This device",
        endpoint: String(row.endpoint).slice(0, 80),
        createdAt: String(row.created_at),
        lastOkAt: row.last_ok_at ?? null,
        current: true,
      };
    },

    async removePushDevice(id) {
      const { error } = await client.from("push_subscriptions").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },

    /* settings ------------------------------------------------------------ */
    async getSettings() {
      const { data, error } = await client.from("settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw new Error(error.message);
      const row = (data ?? {}) as Row;
      return {
        phoneDisplay: row.phone_display ?? "",
        phoneHref: row.phone_href ?? "",
        email: row.email ?? "",
        addressLine1: row.address_line1 ?? "",
        addressLine2: row.address_line2 ?? "",
        ppo: row.ppo ?? "",
        notifyEmail: row.notify_email ?? "",
      } satisfies BusinessSettings;
    },

    async saveSettings(settings) {
      const { error } = await client
        .from("settings")
        .update({
          phone_display: settings.phoneDisplay,
          phone_href: settings.phoneHref,
          email: settings.email,
          address_line1: settings.addressLine1,
          address_line2: settings.addressLine2,
          ppo: settings.ppo,
          notify_email: settings.notifyEmail,
        })
        .eq("id", 1);
      if (error) throw new Error(error.message);
    },
  };
}
