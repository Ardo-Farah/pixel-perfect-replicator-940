import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — WHO Kenya" }] }),
  component: OverviewPage,
});

type Stats = {
  users: number | null;
  reports: number | null;
  documents: number | null;
  published: number | null;
};

type AuditRow = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

function OverviewPage() {
  const [stats, setStats] = useState<Stats>({ users: null, reports: null, documents: null, published: null });
  const [recent, setRecent] = useState<AuditRow[]>([]);

  useEffect(() => {
    (async () => {
      const [{ count: users }, { count: reports }, { count: published }, docs, audit] = await Promise.all([
        supabase.from("profiles" as never).select("*", { count: "exact", head: true }),
        supabase.from("weekly_reports" as never).select("*", { count: "exact", head: true }),
        supabase.from("weekly_reports" as never).select("*", { count: "exact", head: true }).eq("published", true),
        supabase.storage.from("weekly-uploads").list("", { limit: 1000 }),
        supabase.from("audit_log" as never).select("*").order("created_at", { ascending: false }).limit(10),
      ]);
      const countFiles = (entries: { name: string }[] | null): number => entries?.length ?? 0;
      let totalDocs = countFiles(docs.data as { name: string }[] | null);
      if (docs.data) {
        for (const entry of docs.data as { name: string; id?: string | null }[]) {
          if (!entry.id) {
            const sub = await supabase.storage.from("weekly-uploads").list(entry.name, { limit: 1000 });
            totalDocs += countFiles(sub.data as { name: string }[] | null);
          }
        }
        totalDocs -= (docs.data as { id?: string | null }[]).filter((e) => !e.id).length;
      }
      setStats({
        users: users ?? 0,
        reports: reports ?? 0,
        documents: totalDocs,
        published: published ?? 0,
      });
      setRecent(((audit.data as AuditRow[] | null) ?? []));
    })();
  }, []);

  return (
    <AdminShell title="Admin Overview" subtitle="System health & activity">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon="group" label="Total Users" value={stats.users} color="#009ADE" />
        <Kpi icon="description" label="Total Reports" value={stats.reports} color="#00205c" />
        <Kpi icon="folder" label="Documents Stored" value={stats.documents} color="#0d7a5f" />
        <Kpi icon="public" label="Published Weeks" value={stats.published} color="#c9a84c" />
      </div>

      <Card className="p-6">
        <h3 className="text-headline-sm text-primary mb-4">Recent Activity</h3>
        {recent.length === 0 ? (
          <p className="text-on-surface-variant text-sm">No admin actions recorded yet.</p>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-on-surface">{r.action}</p>
                  <p className="text-xs text-on-surface-variant">
                    {r.target_type ?? "—"} {r.target_id ? `· ${r.target_id.slice(0, 8)}` : ""}
                  </p>
                </div>
                <span className="text-xs text-on-surface-variant">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminShell>
  );
}

function Kpi({ icon, label, value, color }: { icon: string; label: string; value: number | null; color: string }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: `${color}22`, color }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-primary">{value === null ? "…" : value.toLocaleString()}</p>
        <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      </div>
    </Card>
  );
}
