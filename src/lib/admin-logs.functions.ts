import { createServerFn } from "@tanstack/react-start";
import { requireAdminRole } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/lib/supabase-admin.server";

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type AdminLogRow = {
  id: string;
  user_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Json;
  created_at: string;
};

export const listAdminLogs = createServerFn({ method: "GET" })
  .middleware([requireAdminRole])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("audit_log")
      .select("id, user_id, action, table_name, report_id, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    type Raw = {
      id: string;
      user_id: string | null;
      action: string;
      table_name: string | null;
      report_id: string | null;
      created_at: string;
    };
    const raw = (data ?? []) as Raw[];
    const actorIds = Array.from(
      new Set(raw.map((r) => r.user_id).filter((v): v is string => !!v)),
    );

    const emailById = new Map<string, string>();
    if (actorIds.length) {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      for (const u of authData?.users ?? []) {
        if (actorIds.includes(u.id)) emailById.set(u.id, u.email ?? "");
      }
    }

    return raw.map<AdminLogRow>((r) => ({
      id: r.id,
      user_id: r.user_id,
      actor_email: r.user_id ? emailById.get(r.user_id) ?? null : null,
      action: r.action,
      target_type: r.table_name,
      target_id: r.report_id,
      metadata: null,
      created_at: r.created_at,
    }));
  });
