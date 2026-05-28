import { createServerFn } from "@tanstack/react-start";
import { requireAdminRole } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/lib/supabase-admin.server";

const BUCKET = "weekly-uploads";

export type AdminOverviewKpis = {
  total_users: number;
  published_reports: number;
  documents_stored: number;
  actions_last_7d: number;
};

export type UploadsPerWeek = { week: string; count: number }[];

export type RecentAudit = {
  id: string;
  action: string;
  actor_email: string | null;
  target: string;
  created_at: string;
}[];

export type AdminOverview = {
  kpis: AdminOverviewKpis;
  uploads_per_week: UploadsPerWeek;
  recent: RecentAudit;
};

async function countStorageFiles(prefix = ""): Promise<number> {
  let total = 0;
  let offset = 0;
  const PAGE = 100;
  while (true) {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).list(prefix, {
      limit: PAGE,
      offset,
    });
    if (error) throw new Error(error.message);
    const entries = data ?? [];
    if (entries.length === 0) break;
    for (const e of entries) {
      if (e.id == null && !e.metadata) {
        total += await countStorageFiles(prefix ? `${prefix}/${e.name}` : e.name);
      } else {
        total += 1;
      }
    }
    if (entries.length < PAGE) break;
    offset += PAGE;
  }
  return total;
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireAdminRole])
  .handler(async (): Promise<AdminOverview> => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const [
      usersRes,
      publishedRes,
      actions7dRes,
      reportsRes,
      auditRes,
      storageCount,
    ] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      supabaseAdmin
        .from("weekly_reports")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
      supabaseAdmin
        .from("audit_log")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),
      supabaseAdmin
        .from("weekly_reports")
        .select("week_number, created_at")
        .order("week_number", { ascending: false })
        .limit(8),
      supabaseAdmin
        .from("audit_log")
        .select("id, user_id, action, table_name, report_id, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      countStorageFiles().catch(() => 0),
    ]);

    const total_users = usersRes.data?.users?.length ?? 0;
    const published_reports = publishedRes.count ?? 0;
    const actions_last_7d = actions7dRes.count ?? 0;

    const uploads_per_week: UploadsPerWeek = (reportsRes.data ?? [])
      .map((r) => ({ week: `W${r.week_number}`, count: 1 }))
      .reverse();

    const auditRows = (auditRes.data ?? []) as Array<{
      id: string;
      user_id: string | null;
      action: string;
      table_name: string | null;
      report_id: string | null;
      created_at: string;
    }>;

    const actorIds = Array.from(
      new Set(auditRows.map((r) => r.user_id).filter((v): v is string => !!v)),
    );
    const emailById = new Map<string, string>();
    for (const u of usersRes.data?.users ?? []) {
      if (actorIds.includes(u.id)) emailById.set(u.id, u.email ?? "");
    }

    const recent: RecentAudit = auditRows.map((r) => ({
      id: r.id,
      action: r.action,
      actor_email: r.user_id ? emailById.get(r.user_id) ?? null : null,
      target: [r.table_name, r.report_id?.slice(0, 8)].filter(Boolean).join(" · "),
      created_at: r.created_at,
    }));

    return {
      kpis: {
        total_users,
        published_reports,
        documents_stored: storageCount,
        actions_last_7d,
      },
      uploads_per_week,
      recent,
    };
  });
