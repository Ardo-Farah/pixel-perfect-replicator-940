import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminRole } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/lib/supabase-admin.server";

const BUCKET = "weekly-uploads";

export type AdminDocumentRow = {
  id: string;
  name: string;
  file_type: string;
  size_bytes: number;
  storage_path: string;
  week_number: number | null;
  uploaded_by: string | null;
  created_at: string;
  uploader_email: string | null;
};

export const listAdminDocuments = createServerFn({ method: "GET" })
  .middleware([requireAdminRole])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("documents")
      .select("id, name, file_type, size_bytes, storage_path, week_number, uploaded_by, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Omit<AdminDocumentRow, "uploader_email">[];
    const uploaderIds = Array.from(
      new Set(rows.map((r) => r.uploaded_by).filter((v): v is string => !!v)),
    );

    const emailById = new Map<string, string>();
    if (uploaderIds.length) {
      // listUsers and filter (no bulk-get-by-ids API)
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      for (const u of authData?.users ?? []) {
        if (uploaderIds.includes(u.id)) emailById.set(u.id, u.email ?? "");
      }
    }

    return rows.map<AdminDocumentRow>((r) => ({
      ...r,
      uploader_email: r.uploaded_by ? emailById.get(r.uploaded_by) ?? null : null,
    }));
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
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: doc, error } = await supabaseAdmin
      .from("documents")
      .select("storage_path, name")
      .eq("id", data.id)
      .single();
    if (error || !doc) throw new Error(error?.message ?? "Document not found");

    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(doc.storage_path, 60, { download: doc.name });
    if (sErr || !signed) throw new Error(sErr?.message ?? "Failed to create download URL");
    return { url: signed.signedUrl };
  });

export const deleteAdminDocument = createServerFn({ method: "POST" })
  .middleware([requireAdminRole])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: doc, error } = await supabaseAdmin
      .from("documents")
      .select("storage_path")
      .eq("id", data.id)
      .single();
    if (error || !doc) throw new Error(error?.message ?? "Document not found");

    await supabaseAdmin.storage.from(BUCKET).remove([doc.storage_path]);

    const { error: delErr } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("id", data.id);
    if (delErr) throw new Error(delErr.message);

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "delete_document",
      target_type: "document",
      target_id: data.id,
    });
    return { ok: true };
  });
