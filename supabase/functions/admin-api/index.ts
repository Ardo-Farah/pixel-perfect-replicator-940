// Edge Function: admin-api
// Runtime: Deno (Supabase Edge Functions)
//
// Consolidates every privileged admin operation that used to run on the app
// host (Lovable) with the service-role key. Now it runs INSIDE Supabase with
// the auto-injected SUPABASE_SERVICE_ROLE_KEY, so the frontend host never needs
// any secret. The browser calls this directly with the signed-in user's JWT;
// the function verifies the user, gates admin-only actions via has_role, and
// routes on an `action` field.
//
// Auto-provided secrets (no manual setup): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
//
// Request:  POST { action: string, ...args } + Authorization: Bearer <user JWT>
// Response: JSON (shape depends on action)

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "weekly-uploads";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const DOCUMENT_LIBRARY_EXTENSIONS = new Set(["pptx", "pdf", "xlsx", "xls", "docx"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Actions any signed-in user may call (none here today, but kept for clarity).
const PUBLIC_ACTIONS = new Set<string>([]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const token = authHeader.slice(7);

  const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Validate the caller's JWT.
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const callerId = userData.user.id;

  let payload: { action?: string; [k: string]: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const action = payload.action;
  if (!action || typeof action !== "string") return json({ error: "Missing action" }, 400);

  // Admin gate (all current actions require admin).
  if (!PUBLIC_ACTIONS.has(action)) {
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (roleErr) return json({ error: `Role check failed: ${roleErr.message}` }, 500);
    if (!isAdmin) return json({ error: "Forbidden: admin role required" }, 403);
  }

  try {
    switch (action) {
      case "list_users":
        return json(await listUsers(admin));
      case "set_user_role":
        return json(await setUserRole(admin, callerId, payload));
      case "delete_user":
        return json(await deleteUser(admin, callerId, payload));
      case "get_overview":
        return json(await getOverview(admin));
      case "list_logs":
        return json(await listLogs(admin));
      case "list_reports":
        return json(await listReports(admin));
      case "set_report_published":
        return json(await setReportPublished(admin, callerId, payload));
      case "delete_report":
        return json(await deleteReport(admin, callerId, payload));
      case "list_documents":
        return json(await listDocuments(admin));
      case "create_document_upload_url":
        return json(await createDocumentUploadUrl(payload));
      case "finalize_document":
        return json(await finalizeDocument(admin, callerId, payload));
      case "get_document_download_url":
        return json(await getDocumentDownloadUrl(admin, payload));
      case "set_document_report":
        return json(await setDocumentReport(admin, payload));
      case "update_report_review_values":
        return json(await updateReportReviewValues(admin, callerId, payload));
      case "publish_document_report":
        return json(await publishDocumentReport(admin, callerId, payload));
      case "delete_document":
        return json(await deleteDocument(admin, callerId, payload));
      case "enable_realtime_bootstrap":
        return json(await enableRealtimeBootstrap(admin));
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message ?? "Internal error" }, 400);
  }
});

// ---- Helpers ---------------------------------------------------------------

async function listAllUsers(admin: SupabaseClient) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(error.message);
  return data.users;
}

async function emailMap(admin: SupabaseClient, ids: string[]) {
  const m = new Map<string, string>();
  if (!ids.length) return m;
  const users = await listAllUsers(admin);
  for (const u of users) if (ids.includes(u.id)) m.set(u.id, u.email ?? "");
  return m;
}

// ---- Users -----------------------------------------------------------------

async function listUsers(admin: SupabaseClient) {
  const users = await listAllUsers(admin);
  const userIds = users.map((u) => u.id);
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    admin.from("profiles").select("id, full_name").in("id", userIds),
    admin.from("user_roles").select("user_id, role").in("user_id", userIds),
  ]);
  const nameById = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]));
  const adminIds = new Set(
    (roles ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id),
  );
  return users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    full_name: nameById.get(u.id) ?? (u.user_metadata as any)?.full_name ?? "",
    role: adminIds.has(u.id) ? "admin" : "user",
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }));
}

async function setUserRole(admin: SupabaseClient, callerId: string, p: any) {
  const userId = String(p.userId);
  const makeAdmin = Boolean(p.makeAdmin);
  if (makeAdmin) {
    const { error } = await admin.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error && !/duplicate|unique/i.test(error.message)) throw new Error(error.message);
  } else {
    if (userId === callerId) throw new Error("You cannot revoke your own admin access.");
    const { error } = await admin
      .from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    if (error) throw new Error(error.message);
  }
  await admin.from("audit_log").insert({
    user_id: callerId,
    action: makeAdmin ? "grant_admin" : "revoke_admin",
    table_name: "user",
    report_id: userId,
  });
  return { ok: true };
}

async function deleteUser(admin: SupabaseClient, callerId: string, p: any) {
  const userId = String(p.userId);
  if (userId === callerId) throw new Error("You cannot delete your own account.");
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  await admin.from("audit_log").insert({
    user_id: callerId, action: "delete_user", table_name: "user", report_id: userId,
  });
  return { ok: true };
}

// ---- Overview --------------------------------------------------------------

async function countStorageFiles(admin: SupabaseClient, prefix = ""): Promise<number> {
  let total = 0;
  let offset = 0;
  const PAGE = 100;
  while (true) {
    const { data, error } = await admin.storage.from(BUCKET).list(prefix, { limit: PAGE, offset });
    if (error) throw new Error(error.message);
    const entries = data ?? [];
    if (entries.length === 0) break;
    for (const e of entries) {
      if ((e as any).id == null && !(e as any).metadata) {
        total += await countStorageFiles(admin, prefix ? `${prefix}/${e.name}` : e.name);
      } else {
        total += 1;
      }
    }
    if (entries.length < PAGE) break;
    offset += PAGE;
  }
  return total;
}

async function getOverview(admin: SupabaseClient) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [usersRes, publishedRes, actions7dRes, reportsRes, auditRes, storageCount] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      admin.from("weekly_reports").select("id", { count: "exact", head: true }).eq("published", true),
      admin.from("audit_log").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      admin.from("weekly_reports").select("week_number, created_at").order("week_number", { ascending: false }).limit(8),
      admin.from("audit_log").select("id, user_id, action, table_name, report_id, created_at").order("created_at", { ascending: false }).limit(8),
      countStorageFiles(admin).catch(() => 0),
    ]);

  const total_users = usersRes.data?.users?.length ?? 0;
  const published_reports = publishedRes.count ?? 0;
  const actions_last_7d = actions7dRes.count ?? 0;
  const uploads_per_week = (reportsRes.data ?? [])
    .map((r: any) => ({ week: `W${r.week_number}`, count: 1 })).reverse();

  const auditRows = (auditRes.data ?? []) as any[];
  const actorIds = Array.from(new Set(auditRows.map((r) => r.user_id).filter(Boolean))) as string[];
  const emailById = new Map<string, string>();
  for (const u of usersRes.data?.users ?? []) {
    if (actorIds.includes(u.id)) emailById.set(u.id, u.email ?? "");
  }
  const recent = auditRows.map((r) => ({
    id: r.id,
    action: r.action,
    actor_email: r.user_id ? emailById.get(r.user_id) ?? null : null,
    target: [r.table_name, r.report_id?.slice(0, 8)].filter(Boolean).join(" · "),
    created_at: r.created_at,
  }));

  return {
    kpis: { total_users, published_reports, documents_stored: storageCount, actions_last_7d },
    uploads_per_week,
    recent,
  };
}

// ---- Logs ------------------------------------------------------------------

async function listLogs(admin: SupabaseClient) {
  const { data, error } = await admin
    .from("audit_log")
    .select("id, user_id, action, table_name, report_id, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  const raw = (data ?? []) as any[];
  const actorIds = Array.from(new Set(raw.map((r) => r.user_id).filter(Boolean))) as string[];
  const emailById = await emailMap(admin, actorIds);
  return raw.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    actor_email: r.user_id ? emailById.get(r.user_id) ?? null : null,
    action: r.action,
    target_type: r.table_name,
    target_id: r.report_id,
    metadata: null,
    created_at: r.created_at,
  }));
}

// ---- Reports ---------------------------------------------------------------

async function listReports(admin: SupabaseClient) {
  const { data, error } = await admin
    .from("weekly_reports")
    .select("id, week_number, reporting_date, published, uploaded_by, created_at")
    .order("week_number", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const reportIds = rows.map((r: any) => r.id);

  const fallbackUploaderByReport = new Map<string, string>();
  if (reportIds.length) {
    const { data: auditRows } = await admin
      .from("audit_log")
      .select("report_id, user_id, created_at")
      .in("report_id", reportIds)
      .in("action", ["process_upload", "upload_report", "create_report", "publish_report"])
      .order("created_at", { ascending: true });
    for (const a of (auditRows ?? []) as any[]) {
      if (a.report_id && a.user_id && !fallbackUploaderByReport.has(a.report_id)) {
        fallbackUploaderByReport.set(a.report_id, a.user_id);
      }
    }
  }

  const evidenceStatsByReport = await getReportEvidenceStats(admin, reportIds);
  const ids = Array.from(new Set(
    rows.map((r: any) => r.uploaded_by ?? fallbackUploaderByReport.get(r.id) ?? null).filter(Boolean),
  )) as string[];
  const emailById = await emailMap(admin, ids);

  return rows.map((r: any) => {
    const uploader = r.uploaded_by ?? fallbackUploaderByReport.get(r.id) ?? null;
    const evidenceStats = evidenceStatsByReport.get(r.id) ?? { rows: 0, candidate_fields: 0, grounded_fields: 0, coverage_pct: null };
    return {
      ...r,
      evidence_rows: evidenceStats.rows,
      has_evidence: evidenceStats.rows > 0,
      evidence_candidate_fields: evidenceStats.candidate_fields,
      evidence_grounded_fields: evidenceStats.grounded_fields,
      evidence_coverage_pct: evidenceStats.coverage_pct,
      uploaded_by: uploader,
      uploader_email: uploader ? emailById.get(uploader) ?? null : null,
    };
  });
}

async function setReportPublished(admin: SupabaseClient, callerId: string, p: any) {
  const id = String(p.id);
  const published = Boolean(p.published);
  if (published) await assertReportHasEvidence(admin, id);
  const { error } = published
    ? await admin.rpc("publish_reviewed_report", {
        _report_id: id,
        _storage_path: "",
        _caller_id: callerId,
      })
    : await admin.from("weekly_reports").update({ published: false }).eq("id", id);
  if (error) throw new Error(error.message);
  await admin.from("audit_log").insert({
    user_id: callerId,
    action: published ? "publish_report" : "unpublish_report",
    table_name: "weekly_report",
    report_id: id,
  });
  return { ok: true };
}

async function assertReportHasEvidence(admin: SupabaseClient, reportId: string) {
  const stats = (await getReportEvidenceStats(admin, [reportId])).get(reportId);
  if (!stats || stats.rows <= 0) {
    throw new Error("Cannot publish: no source evidence was recorded for this report. Re-read the document and review the extraction first.");
  }
  if (stats.candidate_fields >= 4 && stats.coverage_pct !== null && stats.coverage_pct < 75) {
    throw new Error(`Cannot publish: only ${stats.grounded_fields}/${stats.candidate_fields} extracted numeric fields (${stats.coverage_pct}%) are linked to source evidence. Re-read the document or correct the extraction first.`);
  }
}

async function deleteReport(admin: SupabaseClient, callerId: string, p: any) {
  const id = String(p.id);
  const { error } = await admin.from("weekly_reports").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await admin.from("audit_log").insert({
    user_id: callerId, action: "delete_report", table_name: "weekly_report", report_id: id,
  });
  return { ok: true };
}

// ---- Documents -------------------------------------------------------------

const REPORT_CHILD_TABLES = [
  "report_summary", "mpox_data", "mpox_counties", "mpox_demographics",
  "measles_data", "measles_counties", "ebola_data", "cholera_data", "dengue_data",
  "idsr_data", "idsr_counties", "nutrition_data", "nutrition_counties", "weather_data",
];

const GROUND_DROP: Record<string, string[]> = {
  mpox_data: [
    "cumulative_cases", "new_cases_this_week", "deaths", "recovered",
    "active_facility", "active_home", "contacts_listed", "contacts_completed",
    "contacts_follow_up", "vaccinations", "traveller_screenings", "hiv_co_infection_deaths",
  ],
  measles_data: ["total_cases", "confirmed", "suspected"],
};

const SINGLE_CANDIDATE_FIELDS: Record<string, string[]> = {
  report_summary: ["new_events", "outbreaks", "grade_1", "grade_2", "grade_3"],
  mpox_data: GROUND_DROP.mpox_data,
  measles_data: GROUND_DROP.measles_data,
  idsr_data: ["completeness_pct", "timeliness_pct", "cebs_community_signals"],
  nutrition_data: ["phase3_above", "phase4_5"],
};

const ARRAY_CANDIDATE_TABLES = [
  "mpox_counties", "measles_counties", "ebola_data", "cholera_data", "dengue_data",
  "idsr_counties", "nutrition_counties",
] as const;
const ARRAY_CANDIDATE_FIELDS = [
  "cases_2026", "case_count", "cases", "deaths",
  "completeness_pct", "timeliness_pct", "population_affected",
];

type EvidenceStats = {
  rows: number;
  candidate_fields: number;
  grounded_fields: number;
  coverage_pct: number | null;
};

function countNumericCandidates(row: Record<string, unknown>, fields: string[]) {
  let count = 0;
  for (const field of fields) {
    const value = row[field];
    if (typeof value === "number" && Number.isFinite(value) && value !== 0) count += 1;
  }
  return count;
}

async function getReportEvidenceStats(admin: SupabaseClient, reportIds: string[]) {
  const byReport = new Map<string, EvidenceStats>();
  for (const id of reportIds) {
    byReport.set(id, { rows: 0, candidate_fields: 0, grounded_fields: 0, coverage_pct: null });
  }
  if (!reportIds.length) return byReport;

  const { data: evidenceRows, error: evidenceErr } = await admin
    .from("report_extraction_evidence")
    .select("report_id, field_path")
    .in("report_id", reportIds);
  if (evidenceErr) throw new Error(`Evidence lookup failed: ${evidenceErr.message}`);

  const groundedPathsByReport = new Map<string, Set<string>>();
  for (const e of (evidenceRows ?? []) as any[]) {
    if (!e.report_id) continue;
    const stats = byReport.get(e.report_id);
    if (!stats) continue;
    stats.rows += 1;
    if (!groundedPathsByReport.has(e.report_id)) groundedPathsByReport.set(e.report_id, new Set());
    if (e.field_path) groundedPathsByReport.get(e.report_id)!.add(e.field_path);
  }

  const candidateTables = [...Object.keys(SINGLE_CANDIDATE_FIELDS), ...ARRAY_CANDIDATE_TABLES];
  const tableResults = await Promise.all(
    candidateTables.map(async (table) => {
      const { data, error } = await admin.from(table).select("*").in("report_id", reportIds);
      if (error) throw new Error(`Evidence candidate lookup failed for ${table}: ${error.message}`);
      return { table, rows: (data ?? []) as any[] };
    }),
  );

  for (const { table, rows } of tableResults) {
    const singleFields = SINGLE_CANDIDATE_FIELDS[table];
    if (singleFields) {
      for (const row of rows) {
        const stats = byReport.get(row.report_id);
        if (stats) stats.candidate_fields += countNumericCandidates(row, singleFields);
      }
      continue;
    }
    for (const row of rows) {
      const stats = byReport.get(row.report_id);
      if (stats) stats.candidate_fields += countNumericCandidates(row, ARRAY_CANDIDATE_FIELDS);
    }
  }

  for (const [reportId, stats] of byReport) {
    stats.grounded_fields = groundedPathsByReport.get(reportId)?.size ?? 0;
    stats.coverage_pct =
      stats.candidate_fields > 0
        ? Math.min(100, Math.round((stats.grounded_fields / stats.candidate_fields) * 100))
        : null;
  }
  return byReport;
}

async function listAllObjects(admin: SupabaseClient, prefix = ""): Promise<any[]> {
  const out: any[] = [];
  let offset = 0;
  const PAGE = 100;
  while (true) {
    const { data, error } = await admin.storage.from(BUCKET).list(prefix, {
      limit: PAGE, offset, sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(error.message);
    const entries = (data ?? []) as any[];
    if (entries.length === 0) break;
    for (const e of entries) {
      const path = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.id == null && !e.metadata) {
        out.push(...(await listAllObjects(admin, path)));
      } else {
        out.push({ ...e, path });
      }
    }
    if (entries.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

async function listDocuments(admin: SupabaseClient) {
  const objects = await listAllObjects(admin);
  const { data: dbRows } = await admin
    .from("documents")
    .select("storage_path, week_number, uploaded_by, created_at, name, report_id");
  const dbByPath = new Map<string, any>();
  for (const r of (dbRows ?? []) as any[]) dbByPath.set(r.storage_path, r);

  const uploaderIds = Array.from(new Set(
    Array.from(dbByPath.values()).map((r) => r.uploaded_by).filter(Boolean),
  )) as string[];
  const emailById = await emailMap(admin, uploaderIds);

  const libraryObjects = objects.filter((o) => o.path.startsWith("documents/") || dbByPath.has(o.path));
  const rows = libraryObjects.map((o) => {
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
}

async function createDocumentUploadUrl(p: any) {
  const name = String(p.name);
  const size = Number(p.size_bytes ?? 0);
  const ext = (name.split(".").pop() ?? "bin").toLowerCase();
  if (!DOCUMENT_LIBRARY_EXTENSIONS.has(ext)) {
    throw new Error("Unsupported document type. Upload PPTX, PDF, XLSX, XLS, or DOCX.");
  }
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error("Document is empty. Choose the exported file again.");
  }
  if (size > MAX_UPLOAD_BYTES) {
    throw new Error(`Document is too large. Maximum size is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`);
  }
  const storage_path = `documents/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  // Service-role client needed for createSignedUploadUrl.
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data: signed, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(storage_path);
  if (error || !signed) throw new Error(error?.message ?? "Failed to create upload URL");
  return { bucket: BUCKET, storage_path, upload_url: signed.signedUrl, token: signed.token, file_type: ext };
}

async function finalizeDocument(admin: SupabaseClient, callerId: string, p: any) {
  const { data: row, error } = await admin
    .from("documents")
    .insert({
      name: String(p.name),
      file_type: String(p.file_type),
      size_bytes: Number(p.size_bytes),
      storage_path: String(p.storage_path),
      week_number: p.week_number ?? null,
      uploaded_by: callerId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await admin.from("audit_log").insert({
    user_id: callerId, action: "upload_document", table_name: "documents", report_id: row.id,
  });
  return { id: row.id };
}

async function getDocumentDownloadUrl(admin: SupabaseClient, p: any) {
  const storage_path = String(p.storage_path);
  const filename = storage_path.split("/").pop() ?? "download";
  const { data: signed, error } = await admin.storage
    .from(BUCKET).createSignedUrl(storage_path, 60, { download: filename });
  if (error || !signed) throw new Error(error?.message ?? "Failed to create download URL");
  return { url: signed.signedUrl };
}

async function setDocumentReport(admin: SupabaseClient, p: any) {
  const { error } = await admin
    .from("documents").update({ report_id: String(p.report_id) }).eq("storage_path", String(p.storage_path));
  if (error) throw new Error(error.message);
  return { ok: true };
}

const REVIEW_VALUE_FIELDS: Record<string, { table: string; fields: string[] }> = {
  report_summary: {
    table: "report_summary",
    fields: ["new_events", "outbreaks", "grade_1", "grade_2", "grade_3"],
  },
  mpox: {
    table: "mpox_data",
    fields: ["cumulative_cases", "new_cases_this_week", "deaths", "cfr", "counties_affected"],
  },
  measles: {
    table: "measles_data",
    fields: ["total_cases", "confirmed", "suspected", "counties_affected"],
  },
};

function readReviewValuePatches(p: any) {
  const out: Array<{ page: string; field: string; table: string; value: number | null }> = [];
  const values = p.values;
  if (!values || typeof values !== "object" || Array.isArray(values)) return out;
  for (const [page, fields] of Object.entries(values as Record<string, unknown>)) {
    const mapping = REVIEW_VALUE_FIELDS[page];
    if (!mapping || !fields || typeof fields !== "object" || Array.isArray(fields)) continue;
    for (const [field, raw] of Object.entries(fields as Record<string, unknown>)) {
      if (!mapping.fields.includes(field)) continue;
      if (raw === null || raw === "") {
        out.push({ page, field, table: mapping.table, value: null });
        continue;
      }
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`Invalid review value for ${page}.${field}`);
      out.push({ page, field, table: mapping.table, value });
    }
  }
  return out;
}

async function updateReportReviewValues(admin: SupabaseClient, callerId: string, p: any) {
  const reportId = String(p.report_id);
  const patches = readReviewValuePatches(p);
  if (!patches.length) return { ok: true, updated: 0 };

  const byTable = new Map<string, Record<string, number | null>>();
  for (const patch of patches) {
    const update = byTable.get(patch.table) ?? {};
    update[patch.field] = patch.value;
    byTable.set(patch.table, update);
  }

  for (const [table, update] of byTable) {
    const { error } = await admin.from(table).update(update).eq("report_id", reportId);
    if (error) throw new Error(`Could not save reviewed ${table} values: ${error.message}`);
  }

  await admin.from("audit_log").insert({
    user_id: callerId,
    action: "review_edit_report_values",
    table_name: "weekly_report",
    report_id: reportId,
    metadata: {
      fields: patches.map((p) => `${p.page}.${p.field}`),
      values: Object.fromEntries(patches.map((p) => [`${p.page}.${p.field}`, p.value])),
    },
  });

  const manualEvidence = patches
    .filter((p) => p.value !== null)
    .map((p) => ({
      report_id: reportId,
      field_path: `${p.table}.${p.field}`,
      value_text: String(p.value),
      numeric_value: p.value,
      source_type: "manual_review",
      slide_number: null,
      source_snippet: "Manual correction saved during admin review; verify against the uploaded source document.",
      confidence: 1,
    }));
  if (manualEvidence.length) {
    await admin.from("report_extraction_evidence").insert(manualEvidence);
  }

  return { ok: true, updated: patches.length };
}

async function publishDocumentReport(admin: SupabaseClient, callerId: string, p: any) {
  const reportId = String(p.report_id);
  const storagePath = String(p.storage_path);
  await assertReportHasEvidence(admin, reportId);

  const { error: publishErr } = await admin.rpc("publish_reviewed_report", {
    _report_id: reportId,
    _storage_path: storagePath,
    _caller_id: callerId,
  });
  if (publishErr) throw new Error(publishErr.message);

  await admin.from("audit_log").insert({
    user_id: callerId,
    action: "publish_report",
    table_name: "weekly_report",
    report_id: reportId,
    metadata: { storage_path: storagePath, source: "documents_review" },
  });
  return { ok: true };
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

async function findReportIdForDocument(admin: SupabaseClient, storagePath: string, weekNumber: number | null) {
  for (const column of ["pptx_file_path", "xlsx_file_path"]) {
    const { data } = await admin.from("weekly_reports").select("id").eq(column, storagePath).maybeSingle();
    const id = (data as any)?.id ?? null;
    if (id) return id;
  }
  const reportingDate = parseReportDateFromPath(storagePath);
  if (reportingDate) {
    const { data } = await admin.from("weekly_reports").select("id")
      .eq("reporting_date", reportingDate).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const id = (data as any)?.id ?? null;
    if (id) return id;
  }
  if (weekNumber !== null) {
    const { data } = await admin.from("weekly_reports").select("id")
      .eq("week_number", weekNumber).order("reporting_date", { ascending: false }).limit(1).maybeSingle();
    return (data as any)?.id ?? null;
  }
  return null;
}

async function deleteReportCascade(admin: SupabaseClient, reportId: string) {
  await Promise.all(REPORT_CHILD_TABLES.map((t) => admin.from(t).delete().eq("report_id", reportId)));
  const { error } = await admin.from("weekly_reports").delete().eq("id", reportId);
  if (error) throw new Error(error.message);
}

async function deleteDocument(admin: SupabaseClient, callerId: string, p: any) {
  const storage_path = String(p.storage_path);
  const { data: docRow } = await admin
    .from("documents").select("week_number").eq("storage_path", storage_path).maybeSingle();
  const weekNumber = (docRow as any)?.week_number ?? null;

  const deletedReportId = await findReportIdForDocument(admin, storage_path, weekNumber);
  if (deletedReportId) await deleteReportCascade(admin, deletedReportId);

  const { error: rmErr } = await admin.storage.from(BUCKET).remove([storage_path]);
  if (rmErr) throw new Error(rmErr.message);
  await admin.from("documents").delete().eq("storage_path", storage_path);

  await admin.from("audit_log").insert({
    user_id: callerId,
    action: "delete_document",
    table_name: "documents",
    report_id: deletedReportId,
    metadata: { week_number: weekNumber, deleted_report_id: deletedReportId },
  });
  return { ok: true, deletedReportId, weekNumber };
}

// ---- Bootstrap -------------------------------------------------------------

async function enableRealtimeBootstrap(admin: SupabaseClient) {
  const tables = [...REPORT_CHILD_TABLES, "weekly_reports", "documents", "page_content"];
  const uniq = Array.from(new Set(tables));
  const sql = [
    ...uniq.map((t) => `ALTER TABLE public.${t} REPLICA IDENTITY FULL;`),
    `ALTER PUBLICATION supabase_realtime ADD TABLE ${uniq.map((t) => `public.${t}`).join(", ")};`,
  ].join("\n");
  const { error } = await (admin.rpc as any)("exec_sql", { sql });
  if (error) return { ok: false, manual_sql: sql, reason: error.message };
  return { ok: true, manual_sql: null, reason: null };
}
