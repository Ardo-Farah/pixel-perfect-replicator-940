import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminRole } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/lib/supabase-admin.server";

const BUCKET = "weekly-uploads";

export type AdminDocumentRow = {
  id: string; // storage_path is the stable id
  name: string;
  file_type: string;
  size_bytes: number;
  storage_path: string;
  week_number: number | null;
  uploaded_by: string | null;
  created_at: string;
  uploader_email: string | null;
};

type StorageEntry = {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: { size?: number; mimetype?: string } | null;
};

// Recursively list every object in the bucket.
async function listAllObjects(prefix = ""): Promise<Array<StorageEntry & { path: string }>> {
  const out: Array<StorageEntry & { path: string }> = [];
  let offset = 0;
  const PAGE = 100;
  while (true) {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).list(prefix, {
      limit: PAGE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(error.message);
    const entries = (data ?? []) as StorageEntry[];
    if (entries.length === 0) break;

    for (const e of entries) {
      const path = prefix ? `${prefix}/${e.name}` : e.name;
      // Folders have id == null and no metadata.
      if (e.id == null && !e.metadata) {
        const children = await listAllObjects(path);
        out.push(...children);
      } else {
        out.push({ ...e, path });
      }
    }
    if (entries.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

export const listAdminDocuments = createServerFn({ method: "GET" })
  .middleware([requireAdminRole])
  .handler(async () => {
    // 1. Pull every file in the storage bucket.
    const objects = await listAllObjects();

    // 2. Pull DB rows for any metadata we have (week_number, uploader).
    const { data: dbRows } = await supabaseAdmin
      .from("documents")
      .select("storage_path, week_number, uploaded_by, created_at, name");
    const dbByPath = new Map<string, {
      week_number: number | null;
      uploaded_by: string | null;
      created_at: string;
      name: string;
    }>();
    for (const r of dbRows ?? []) {
      dbByPath.set(r.storage_path, {
        week_number: r.week_number,
        uploaded_by: r.uploaded_by,
        created_at: r.created_at,
        name: r.name,
      });
    }

    // 3. Resolve uploader emails in one shot.
    const uploaderIds = Array.from(
      new Set(
        Array.from(dbByPath.values())
          .map((r) => r.uploaded_by)
          .filter((v): v is string => !!v),
      ),
    );
    const emailById = new Map<string, string>();
    if (uploaderIds.length) {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      for (const u of authData?.users ?? []) {
        if (uploaderIds.includes(u.id)) emailById.set(u.id, u.email ?? "");
      }
    }

    // 4. Merge.
    const rows: AdminDocumentRow[] = objects.map((o) => {
      const meta = dbByPath.get(o.path);
      const name = meta?.name ?? o.name;
      const ext = (name.split(".").pop() ?? "bin").toLowerCase();
      const created_at = meta?.created_at ?? o.created_at ?? o.updated_at ?? new Date(0).toISOString();
      return {
        id: o.path,
        name,
        file_type: ext,
        size_bytes: o.metadata?.size ?? 0,
        storage_path: o.path,
        week_number: meta?.week_number ?? null,
        uploaded_by: meta?.uploaded_by ?? null,
        created_at,
        uploader_email: meta?.uploaded_by ? emailById.get(meta.uploaded_by) ?? null : null,
      };
    });

    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return rows;
  });

export const createDocumentUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireAdminRole])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().min(1).max(255),
        size_bytes: z.number().int().min(0).max(100 * 1024 * 1024),
        week_number: z.number().int().min(0).max(60).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const ext = (data.name.split(".").pop() ?? "bin").toLowerCase();
    const storage_path = `documents/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(storage_path);
    if (error || !signed) throw new Error(error?.message ?? "Failed to create upload URL");
    return {
      bucket: BUCKET,
      storage_path,
      token: signed.token,
      file_type: ext,
    };
  });

export const finalizeDocumentUpload = createServerFn({ method: "POST" })
  .middleware([requireAdminRole])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().min(1).max(255),
        file_type: z.string().min(1).max(20),
        size_bytes: z.number().int().min(0),
        storage_path: z.string().min(1),
        week_number: z.number().int().min(0).max(60).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await supabaseAdmin
      .from("documents")
      .insert({
        name: data.name,
        file_type: data.file_type,
        size_bytes: data.size_bytes,
        storage_path: data.storage_path,
        week_number: data.week_number ?? null,
        uploaded_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "upload_document",
      target_type: "document",
      target_id: row.id,
      metadata: { name: data.name, size_bytes: data.size_bytes },
    });
    return { id: row.id };
  });

export const getDocumentDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireAdminRole])
  .inputValidator((input) => z.object({ storage_path: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const filename = data.storage_path.split("/").pop() ?? "download";
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(data.storage_path, 60, { download: filename });
    if (error || !signed) throw new Error(error?.message ?? "Failed to create download URL");
    return { url: signed.signedUrl };
  });

export const deleteAdminDocument = createServerFn({ method: "POST" })
  .middleware([requireAdminRole])
  .inputValidator((input) => z.object({ storage_path: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error: rmErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove([data.storage_path]);
    if (rmErr) throw new Error(rmErr.message);

    await supabaseAdmin.from("documents").delete().eq("storage_path", data.storage_path);

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "delete_document",
      target_type: "document",
      target_id: data.storage_path,
      metadata: { storage_path: data.storage_path },
    });
    return { ok: true };
  });
