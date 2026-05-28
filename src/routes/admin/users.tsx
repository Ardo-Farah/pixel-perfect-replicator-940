import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { toast } from "@/lib/toast";
import { mockUsers, type AdminUser } from "@/lib/admin-mock-data";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Admin · Users — WHO Kenya" }] }),
  component: UsersPage,
});

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const toggleAdmin = (id: string) => {
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, role: u.role === "admin" ? "user" : "admin" } : u)));
    toast.success("Mock action — backend wiring next phase");
  };

  const remove = (id: string) => {
    if (!confirm("Delete this user? (mock — nothing is actually removed yet)")) return;
    setUsers((us) => us.filter((u) => u.id !== id));
    toast.success("Mock action — backend wiring next phase");
  };

  return (
    <AdminShell title="Users Management" subtitle="Grant or revoke admin access">
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm"
        />
        <span className="text-xs text-on-surface-variant">{filtered.length} users</span>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">No users match the search.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Last active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((u) => {
                const admin = u.role === "admin";
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-semibold">{u.full_name}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        admin ? "bg-[#009ADE] text-white" : "bg-surface-container-high text-on-surface-variant"
                      }`}>
                        {admin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{new Date(u.last_active_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => toggleAdmin(u.id)}
                        className={`rounded-md px-3 py-1 text-xs font-semibold ${
                          admin ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-[#009ADE] text-white hover:opacity-90"
                        }`}
                      >
                        {admin ? "Revoke Admin" : "Grant Admin"}
                      </button>
                      <button
                        onClick={() => remove(u.id)}
                        className="rounded-md border border-outline-variant px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
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
