import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Admin · Users — WHO Kenya" }] }),
  component: UsersPage,
});

type Profile = { id: string; full_name: string | null; created_at: string };
type Role = { user_id: string; role: string };

function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([
      supabase.from("profiles" as never).select("id, full_name, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles" as never).select("user_id, role"),
    ]);
    if (p.error) toast.error(p.error.message);
    setProfiles(((p.data as Profile[]) ?? []));
    setRoles(((r.data as Role[]) ?? []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const isAdmin = (uid: string) => roles.some((r) => r.user_id === uid && r.role === "admin");

  const toggleAdmin = async (uid: string) => {
    if (isAdmin(uid)) {
      const { error } = await supabase
        .from("user_roles" as never)
        .delete()
        .eq("user_id", uid)
        .eq("role", "admin");
      if (error) return toast.error(error.message);
      await logAction("revoke_admin", "user", uid);
      toast.success("Admin revoked");
    } else {
      const { error } = await supabase.from("user_roles" as never).insert({ user_id: uid, role: "admin" });
      if (error) return toast.error(error.message);
      await logAction("grant_admin", "user", uid);
      toast.success("Admin granted");
    }
    load();
  };

  return (
    <AdminShell title="Users Management" subtitle="Grant or revoke admin access">
      <Card className="overflow-hidden">
        {profiles === null ? (
          <div className="p-8 text-center text-on-surface-variant">Loading…</div>
        ) : profiles.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">No users signed up yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {profiles.map((p) => {
                const admin = isAdmin(p.id);
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-semibold">{p.full_name || "(no name)"}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant font-mono">{p.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        admin ? "bg-[#009ADE] text-white" : "bg-surface-container-high text-on-surface-variant"
                      }`}>
                        {admin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleAdmin(p.id)}
                        className={`rounded-md px-3 py-1 text-xs font-semibold ${
                          admin ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-[#009ADE] text-white hover:opacity-90"
                        }`}
                      >
                        {admin ? "Revoke Admin" : "Grant Admin"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
      <p className="text-xs text-on-surface-variant">
        Note: Deleting users requires service-role access. Use the backend dashboard for full account removal.
      </p>
    </AdminShell>
  );
}

async function logAction(action: string, target_type: string, target_id: string) {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return;
  await supabase.from("audit_log" as never).insert({ user_id: uid, action, target_type, target_id });
}
