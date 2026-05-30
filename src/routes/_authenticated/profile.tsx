import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Official Profile — Updates" },
      { name: "description", content: "Official profile, jurisdiction and security settings for Mpox personnel." },
    ],
  }),
  component: ProfilePage,
});

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  department: string | null;
  station: string | null;
  staff_id: string | null;
  assigned_counties: string[] | null;
};

type AuditRow = {
  action: string | null;
  table_name: string | null;
  created_at: string;
};

function Card({ icon, title, children, action }: { icon: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: 22 }}>{icon}</span>
          <h3 className="text-headline-sm font-semibold text-on-surface">{title}</h3>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function NotSet({ onEdit }: { onEdit: () => void }) {
  return (
    <span className="italic text-on-surface-variant">
      Not set
      <button onClick={onEdit} className="ml-2 not-italic text-secondary hover:underline">Edit</button>
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-label-caps uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 text-body-md text-on-surface">{value}</p>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={[
        "relative h-6 w-11 rounded-full transition-colors",
        on ? "bg-secondary" : "bg-outline-variant",
      ].join(" ")}
      aria-pressed={on}
    >
      <span
        className={[
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          on ? "left-[22px]" : "left-0.5",
        ].join(" ")}
      />
    </button>
  );
}

function initialsOf(name: string | null | undefined) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  return (parts[0][0] + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

const ACTION_LABELS: Record<string, string> = {
  process_upload: "Uploaded Report",
  download_pdf: "Downloaded PDF",
  login: "Signed In",
};

function formatAction(a: string | null): string {
  if (!a) return "Action";
  return ACTION_LABELS[a] ?? a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDetails(d: Record<string, unknown> | string | null): string {
  if (d == null) return "—";
  if (typeof d === "string") return d || "—";
  const parts: string[] = [];
  if (d.file_name) parts.push(String(d.file_name));
  if (d.week_number != null) parts.push(`Week ${d.week_number}`);
  if (d.tables_written != null) parts.push(`${d.tables_written} tables`);
  if (d.duration_ms != null) parts.push(`${d.duration_ms} ms`);
  return parts.length ? parts.join(" · ") : "—";
}

type LogRow = {
  action: string | null;
  details: Record<string, unknown> | string | null;
  table_name: string | null;
  report_id: string | null;
  created_at: string;
};

const LOGS_PAGE_SIZE = 20;

function ProfilePage() {
  const [twoFA, setTwoFA] = useState(true);
  const [loginNotif, setLoginNotif] = useState(false);
  const [access, setAccess] = useState<"user" | "admin">("user");

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  const loadAll = useCallback(async (uid: string) => {
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase
        .from("audit_log")
        .select("action, table_name, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    setProfile((p as ProfileRow | null) ?? { id: uid, full_name: null, phone: null, role: null, department: null, station: null, staff_id: null, assigned_counties: [] });
    setAuditRows((a as AuditRow[] | null) ?? []);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted || !data.user) return;
      setUserId(data.user.id);
      setEmail(data.user.email ?? null);
      loadAll(data.user.id);
    });
    return () => {
      mounted = false;
    };
  }, [loadAll]);

  // Live "Recent Actions": subscribe to new audit_log rows for this user and
  // prepend them instantly. The fetch above only seeds the initial list.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`audit-log-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "audit_log",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const r = payload.new as {
            action: string | null;
            table_name: string | null;
            created_at: string;
          };
          setAuditRows((prev) =>
            [
              { action: r.action, table_name: r.table_name, created_at: r.created_at },
              ...prev,
            ].slice(0, 10),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const openEdit = () => setDialogOpen(true);

  const fullName = profile?.full_name?.trim() || null;
  const counties = profile?.assigned_counties ?? [];

  return (
    <AppShell title={"Updates\n"} subtitle="Official Profile">
      {/* Header banner */}
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="h-24 bg-gradient-to-r from-secondary-container to-surface-container" />
        <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-6 pt-0">
          <div className="-mt-12 flex items-end gap-5">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border-4 border-surface-container-lowest bg-primary">
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-on-primary">{initialsOf(fullName)}</div>
              <span className="absolute bottom-1 left-1 h-3 w-3 rounded-full border-2 border-surface-container-lowest bg-secondary" />
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-3">
                <h1 className="text-headline-md font-bold text-on-surface">{fullName ?? "Not set"}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-0.5 text-label-caps font-semibold text-on-secondary-container">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> ACTIVE
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-body-md text-on-surface-variant">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: 18 }}>verified_user</span>
                {profile?.role ?? "Not set"}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pb-1">
            <button onClick={openEdit} className="rounded-lg bg-primary px-5 py-2.5 text-body-md font-semibold text-on-primary hover:opacity-90">
              Edit Profile
            </button>
            <button onClick={() => setLogsOpen(true)} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-body-md font-semibold text-on-surface hover:bg-surface-container-low">
              View Logs
            </button>
          </div>
        </div>
      </section>

      {/* Profile card */}
      <div className="grid grid-cols-1 gap-6">
        <Card icon="workspace_premium" title={`Profile — ${fullName ?? "Not set"}`}>
          <Field label="Staff ID" value={profile?.staff_id ?? <NotSet onEdit={openEdit} />} />
          <div className="mb-4">
            <p className="text-label-caps uppercase tracking-wider text-on-surface-variant">Access Level</p>
            <div className="mt-2 inline-flex overflow-hidden rounded-md border border-outline-variant">
              {(["user", "admin"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setAccess(lvl)}
                  className={[
                    "px-3 py-1.5 text-label-caps font-semibold uppercase",
                    access === lvl
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low",
                  ].join(" ")}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
          <Field label="Unit" value={profile?.department ?? <NotSet onEdit={openEdit} />} />
          <div className="mt-5 border-t border-outline-variant pt-4">
            <a href="/admin" className="text-body-md font-semibold text-secondary hover:underline">
              Go to Admin Dashboard →
            </a>
          </div>
        </Card>
      </div>


      {/* Two-column */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            icon="history"
            title="Recent Actions"
            action={<a href="#" className="text-label-caps font-semibold text-secondary hover:underline">VIEW ALL ACTIVITY</a>}
          >
            {auditRows.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">No recent activity.</p>
            ) : (
              <ol className="relative space-y-5 border-l border-outline-variant pl-6">
                {auditRows.map((a, i) => (
                  <li key={`${a.created_at}-${i}`} className="relative">
                    <span className="absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>update</span>
                    </span>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-body-md font-semibold text-on-surface">{a.action ?? "Action"}</p>
                        {a.table_name && (
                          <p className="text-body-md text-on-surface-variant">on {a.table_name}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-label-caps text-on-surface-variant">{relativeTime(a.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <Card icon="shield" title="Security & Privacy">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-body-md font-semibold text-on-surface">Two-Factor Authentication</p>
              <p className="text-label-caps text-on-surface-variant">Extra security layer via SMS/App</p>
            </div>
            <Toggle on={twoFA} onChange={setTwoFA} />
          </div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-body-md font-semibold text-on-surface">Login Notifications</p>
              <p className="text-label-caps text-on-surface-variant">Alert me for new logins</p>
            </div>
            <Toggle on={loginNotif} onChange={setLoginNotif} />
          </div>
          <button className="mb-3 w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 text-body-md font-semibold text-on-surface hover:bg-surface-container-low">
            Change Password
          </button>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-error-container py-2.5 text-body-md font-semibold text-on-error-container hover:opacity-90">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            Sign Out of All Devices
          </button>
        </Card>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-5 text-label-caps text-on-surface-variant">
        <div>
          System Status: <span className="font-semibold text-secondary">STABLE</span>
          <span className="mx-2">•</span>
          Version 2.4.1-LTS
        </div>
        <div className="flex gap-5">
          <a href="#" className="hover:text-on-surface">Privacy Policy</a>
          <a href="#" className="hover:text-on-surface">Technical Support</a>
          <a href="#" className="hover:text-on-surface">Incident Reporting</a>
        </div>
      </footer>

      {userId && (
        <EditProfileDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          userId={userId}
          profile={profile}
          onSaved={() => loadAll(userId)}
        />
      )}
      {userId && (
        <LogsDialog open={logsOpen} onOpenChange={setLogsOpen} userId={userId} />
      )}
    </AppShell>
  );
}

function EditProfileDialog({
  open,
  onOpenChange,
  userId,
  profile,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  profile: ProfileRow | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    role: "",
    department: "",
    station: "",
    staff_id: "",
    assigned_counties: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        full_name: profile?.full_name ?? "",
        phone: profile?.phone ?? "",
        role: profile?.role ?? "",
        department: profile?.department ?? "",
        station: profile?.station ?? "",
        staff_id: profile?.staff_id ?? "",
        assigned_counties: (profile?.assigned_counties ?? []).join(", "),
      });
      setError(null);
    }
  }, [open, profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      id: userId,
      full_name: form.full_name.trim() || null,
      phone: form.phone.trim() || null,
      // role is intentionally omitted — a user must not be able to change their
      // own role. Roles are managed by admins (user_roles / admin Users page).
      department: form.department.trim() || null,
      station: form.station.trim() || null,
      staff_id: form.staff_id.trim() || null,
      assigned_counties: form.assigned_counties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const { error: err } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
    onOpenChange(false);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" value={form.full_name} onChange={set("full_name")} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={set("phone")} />
            </div>
            <div>
              <Label htmlFor="staff_id">Staff ID</Label>
              <Input id="staff_id" value={form.staff_id} onChange={set("staff_id")} />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={form.role || "—"} readOnly disabled className="opacity-70" />
              <p className="mt-1 text-[11px] text-on-surface-variant">Set by an administrator.</p>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={form.department} onChange={set("department")} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="station">Primary station</Label>
              <Input id="station" value={form.station} onChange={set("station")} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="assigned_counties">Assigned counties (comma-separated)</Label>
              <Input id="assigned_counties" value={form.assigned_counties} onChange={set("assigned_counties")} placeholder="Nakuru County, Baringo County" />
            </div>
          </div>
          {error && <p className="text-body-md text-error">{error}</p>}
          <DialogFooter>
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-body-md font-semibold text-on-surface hover:bg-surface-container-low">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-body-md font-semibold text-on-primary hover:opacity-90 disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LogsDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
}) {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [weekById, setWeekById] = useState<Record<string, number>>({});
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setPage(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      const from = page * LOGS_PAGE_SIZE;
      const to = from + LOGS_PAGE_SIZE - 1;
      const { data, count: total } = await supabase
        .from("audit_log")
        .select("action, details, table_name, report_id, created_at", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (!mounted) return;
      const list = (data as LogRow[] | null) ?? [];
      const ids = [...new Set(list.map((r) => r.report_id).filter(Boolean))] as string[];
      let map: Record<string, number> = {};
      if (ids.length) {
        const { data: wks } = await supabase
          .from("weekly_reports")
          .select("id, week_number")
          .in("id", ids);
        if (!mounted) return;
        map = Object.fromEntries(
          ((wks as { id: string; week_number: number }[] | null) ?? []).map((w) => [w.id, w.week_number]),
        );
      }
      setRows(list);
      setWeekById(map);
      setCount(total ?? 0);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [open, page, userId]);

  const totalPages = Math.max(1, Math.ceil(count / LOGS_PAGE_SIZE));
  const hasNext = (page + 1) * LOGS_PAGE_SIZE < count;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Activity Logs</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-outline-variant bg-surface-container-low">
                {["Action", "Details", "Week", "Timestamp"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-table-header uppercase tracking-wider text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-body-md text-on-surface-variant">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-body-md text-on-surface-variant">No activity logged.</td></tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={`${r.created_at}-${i}`} className="hover:bg-surface-container">
                    <td className="px-4 py-3 text-body-md font-semibold text-on-surface">{formatAction(r.action)}</td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">{formatDetails(r.details)}</td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">
                      {r.report_id && weekById[r.report_id] != null ? `Week ${weekById[r.report_id]}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <span className="mr-auto text-label-caps text-on-surface-variant">
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-body-md font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-60"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || loading}
            className="rounded-lg bg-primary px-4 py-2 text-body-md font-semibold text-on-primary hover:opacity-90 disabled:opacity-60"
          >
            Next
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
