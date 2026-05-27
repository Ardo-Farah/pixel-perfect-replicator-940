import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

export const Route = createFileRoute("/_admin/documents")({
  head: () => ({ meta: [{ title: "Admin · Documents — WHO Kenya" }] }),
  component: DocumentsPage,
});

type Doc = { path: string; name: string; size: number; created_at: string | null; uploader: string };

function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[] | null>(null);

  const load = useCallback(async () => {
    setDocs(null);
    // List top-level "folders" (each user has folder = their uid)
    const { data: folders, error } = await supabase.storage.from("weekly-uploads").list("", { limit: 1000 });
    if (error) {
      toast.error(error.message);
      setDocs([]);
      return;
    }
    const out: Doc[] = [];
    for (const f of (folders ?? [])) {
      // Per Supabase: folder entries have id === null
      const entry = f as unknown as { id: string | null; name: string };
      if (entry.id === null) {
        const { data: inner } = await supabase.storage.from("weekly-uploads").list(entry.name, { limit: 1000 });
        for (const file of (inner ?? [])) {
          const meta = file as unknown as { name: string; created_at: string | null; metadata?: { size?: number } };
          out.push({
            path: `${entry.name}/${meta.name}`,
            name: meta.name,
            size: meta.metadata?.size ?? 0,
            created_at: meta.created_at,
            uploader: entry.name,
          });
        }
      } else {
        const meta = f as unknown as { name: string; created_at: string | null; metadata?: { size?: number } };
        out.push({
          path: meta.name,
          name: meta.name,
          size: meta.metadata?.size ?? 0,
          created_at: meta.created_at,
          uploader: "root",
        });
      }
    }
    out.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    setDocs(out);
  }, []);

  useEffect(() => { load(); }, [load]);

  const download = async (d: Doc) => {
    const { data, error } = await supabase.storage.from("weekly-uploads").createSignedUrl(d.path, 60);
    if (error || !data) return toast.error(error?.message ?? "Failed");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const remove = async (d: Doc) => {
    if (!confirm(`Delete ${d.name}?`)) return;
    const { error } = await supabase.storage.from("weekly-uploads").remove([d.path]);
    if (error) return toast.error(error.message);
    await logAction("delete_document", "storage_object", d.path);
    toast.success("Deleted");
    load();
  };

  return (
    <AdminShell title="Documents Library" subtitle="All files in storage (weekly-uploads bucket)">
      <Card className="overflow-hidden">
        {docs === null ? (
          <div className="p-8 text-center text-on-surface-variant">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">No documents in storage.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploader</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {docs.map((d) => (
                <tr key={d.path}>
                  <td className="px-4 py-3 font-semibold break-all">{d.name}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{fmtSize(d.size)}</td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant font-mono">{d.uploader.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => download(d)} className="rounded-md border border-outline-variant px-3 py-1 text-xs font-semibold hover:bg-surface-container-low">
                      Download
                    </button>
                    <button onClick={() => remove(d)} className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AdminShell>
  );
}

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

async function logAction(action: string, target_type: string, target_id: string) {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return;
  await supabase.from("audit_log" as never).insert({ user_id: uid, action, target_type, target_id });
}
