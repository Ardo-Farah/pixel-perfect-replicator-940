import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { toast } from "@/lib/toast";
import {
  listAdminUsers,
  setUserAdminRole,
  deleteAdminUser,
  type AdminUserRow,
} from "@/lib/admin-api";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Admin · Users — WHO Kenya" }] }),
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();
  const list = listAdminUsers;
  const setRole = setUserAdminRole;
  const del = deleteAdminUser;

  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const roleMut = useMutation({
    mutationFn: (v: { userId: string; makeAdmin: boolean }) => setRole({ data: v }),
    onSuccess: (_d, v) => {
      toast.success(v.makeAdmin ? "Admin granted" : "Admin revoked");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update role"),
  });

  const deleteMut = useMutation({
    mutationFn: (userId: string) => del({ data: { userId } }),
    onSuccess: () => {
      toast.success("User deleted");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete user"),
  });

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u: AdminUserRow) =>
        u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  return (
    <AdminShell title="Users Management" subtitle="Grant or revoke admin access">
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm"
        />
        <span className="text-xs text-on-surface-variant">
          {isLoading ? "Loading…" : `${filtered.length} users`}
        </span>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-on-surface-variant">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Last sign-in</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((u: AdminUserRow) => {
                const admin = u.role === "admin";
                const busy = roleMut.isPending || deleteMut.isPending;
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-semibold">{u.full_name || "—"}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          admin
                            ? "bg-[#009ADE] text-white"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {admin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        disabled={busy}
                        onClick={() =>
                          roleMut.mutate({ userId: u.id, makeAdmin: !admin })
                        }
                        className={`rounded-md px-3 py-1 text-xs font-semibold disabled:opacity-50 ${
                          admin
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-[#009ADE] text-white hover:opacity-90"
                        }`}
                      >
                        {admin ? "Revoke Admin" : "Grant Admin"}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => {
                          if (confirm(`Delete ${u.email}? This cannot be undone.`)) {
                            deleteMut.mutate(u.id);
                          }
                        }}
                        className="rounded-md border border-outline-variant px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </AdminShell>
  );
}
