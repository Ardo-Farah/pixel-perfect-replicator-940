import { createServerFn } from "@tanstack/react-start";
import { requireAdminRole } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/lib/supabase-admin.server";

export type AdminLogRow = {
  id: string;
  user_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: unknown | null;
  created_at: string;
};

export const listAdminLogs = createServerFn({ method: "GET" })
  .middleware([requireAdminRole])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("audit_log")
      .select("id, user_id, action, target_type, target_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Omit<AdminLogRow, "actor_email">[];
    const actorIds = Array.from(
      new Set(rows.map((r) => r.user_id).filter((v): v is string => !!v)),
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

    return rows.map<AdminLogRow>((r) => ({
      ...r,
      actor_email: r.user_id ? emailById.get(r.user_id) ?? null : null,
    }));
  });
