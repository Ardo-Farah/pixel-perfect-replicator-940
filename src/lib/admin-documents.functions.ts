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
  report_id: string | null;
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
      .select("storage_path, week_number, uploaded_by, created_at, name, report_id");
    const dbByPath = new Map<string, {
      week_number: number | null;
      uploaded_by: string | null;
      created_at: string;
      name: string;
      report_id: string | null;
    }>();
    for (const r of dbRows ?? []) {
      dbByPath.set(r.storage_path, {
        week_number: r.week_number,
        uploaded_by: r.uploaded_by,
        created_at: r.created_at,
        name: r.name,
        report_id: (r as { report_id: string | null }).report_id ?? null,
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
        report_id: meta?.report_id ?? null,
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
      upload_url: signed.signedUrl,
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
      table_name: "documents",
      report_id: row.id,
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

// Link a library document to the weekly_report it produced (set after the file
// is read into the dashboard), so the document selector can resolve it directly.
export const setDocumentReport = createServerFn({ method: "POST" })
  .middleware([requireAdminRole])
  .inputValidator((input) =>
    z.object({ storage_path: z.string().min(1), report_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("documents")
      .update({ report_id: data.report_id })
      .eq("storage_path", data.storage_path);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Child data tables that hang off a weekly_reports row.
const REPORT_CHILD_TABLES = [
  "report_summary",
  "mpox_data",
  "mpox_counties",
  "mpox_demographics",
  "measles_data",
  "measles_counties",
  "anthrax_data",
  "floods_data",
  "idsr_data",
  "idsr_counties",
  "nutrition_data",
  "nutrition_counties",
  "weather_data",
] as const;

async function deleteReportCascade(reportId: string) {
  await Promise.all(
    REPORT_CHILD_TABLES.map((t) =>
      supabaseAdmin.from(t as never).delete().eq("report_id", reportId),
    ),
  );
  const { error } = await supabaseAdmin
    .from("weekly_reports" as never)
    .delete()
    .eq("id", reportId);
  if (error) throw new Error(error.message);
}

function parseReportDateFromPath(storagePath: string): string | null {
  const name = decodeURIComponent(storagePath.split("/").pop() ?? storagePath).toLowerCase();
  const match = name.match(/(\d{1,2})(?:st|nd|rd|th)?[\s_-]+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s_-]+(20\d{2})/i);
  if (!match) return null;
  const months: Record<string, string> = {
    jan: "01", january: "01", feb: "02", february: "02", mar: "03", march: "03",
    apr: "04", april: "04", may: "05", jun: "06", june: "06", jul: "07", july: "07",
    aug: "08", august: "08", sep: "09", september: "09", oct: "10", october: "10",
    nov: "11", november: "11", dec: "12", december: "12",
  };
  return `${match[3]}-${months[match[2].toLowerCase()]}-${match[1].padStart(2, "0")}`;
}

async function findReportIdForDocument(storagePath: string, weekNumber: number | null) {
  for (const column of ["pptx_file_path", "xlsx_file_path"] as const) {
    const { data } = await supabaseAdmin
      .from("weekly_reports" as never)
      .select("id")
      .eq(column, storagePath)
      .maybeSingle();
    const id = (data as { id: string } | null)?.id ?? null;
    if (id) return id;
  }

  const reportingDate = parseReportDateFromPath(storagePath);
  if (reportingDate) {
    const { data } = await supabaseAdmin
      .from("weekly_reports" as never)
      .select("id")
      .eq("reporting_date", reportingDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const id = (data as { id: string } | null)?.id ?? null;
    if (id) return id;
  }

  if (weekNumber !== null) {
    const { data } = await supabaseAdmin
      .from("weekly_reports" as never)
      .select("id")
      .eq("week_number", weekNumber)
      .order("reporting_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as { id: string } | null)?.id ?? null;
  }

  return null;
}

export const deleteAdminDocument = createServerFn({ method: "POST" })
  .middleware([requireAdminRole])
  .inputValidator((input) => z.object({ storage_path: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    // 1. Look up the document row so we know which weekly_report it produced.
    const { data: docRow } = await supabaseAdmin
      .from("documents")
      .select("week_number")
      .eq("storage_path", data.storage_path)
      .maybeSingle();

    const weekNumber =
      (docRow as { week_number: number | null } | null)?.week_number ?? null;

    // 2. Cascade-delete the linked weekly_reports row + all its disease data.
    // Prefer exact file-path links, then date/legacy week metadata.
    const deletedReportId = await findReportIdForDocument(data.storage_path, weekNumber);
    if (deletedReportId) await deleteReportCascade(deletedReportId);

    // 3. Remove the storage object and the documents row.
    const { error: rmErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove([data.storage_path]);
    if (rmErr) throw new Error(rmErr.message);

    await supabaseAdmin.from("documents").delete().eq("storage_path", data.storage_path);

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "delete_document",
      table_name: "documents",
      report_id: deletedReportId,
      metadata: { week_number: weekNumber, deleted_report_id: deletedReportId },
    } as never);
    return { ok: true, deletedReportId, weekNumber };
  });
