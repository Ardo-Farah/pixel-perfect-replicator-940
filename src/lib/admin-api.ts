// Client for the `admin-api` Supabase Edge Function. Every privileged admin
// operation runs inside Supabase with the service role; the app host needs no
// secret. The browser calls the function with the signed-in user's JWT (the
// supabase client attaches it automatically) and the function gates on admin.
//
// Wrappers keep the same `(opts?: { data: ARGS })` calling convention the old
// server functions used, so page call sites change only their import.
import { supabase } from "@/lib/supabase";

async function invokeAdmin<T>(action: string, data?: Record<string, unknown>): Promise<T> {
  const { data: res, error } = await supabase.functions.invoke("admin-api", {
    body: { action, ...(data ?? {}) },
  });
  if (error) {
    let msg = error.message;
    try {
      const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
      if (ctx && typeof ctx.json === "function") {
        const body = await ctx.json();
        if (body?.error) msg = body.error;
      }
    } catch {
      /* keep generic message */
    }
    throw new Error(msg);
  }
  return res as T;
}

// ---- Types (previously exported from the *.functions.ts files) -------------

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
  created_at: string;
  last_sign_in_at: string | null;
};

export type AdminOverviewKpis = {
  total_users: number;
  published_reports: number;
  documents_stored: number;
  actions_last_7d: number;
};
export type UploadsPerWeek = { week: string; count: number }[];
export type RecentAudit = {
  id: string;
  action: string;
  actor_email: string | null;
  target: string;
  created_at: string;
}[];
export type AdminOverview = {
  kpis: AdminOverviewKpis;
  uploads_per_week: UploadsPerWeek;
  recent: RecentAudit;
};

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
export type AdminLogRow = {
  id: string;
  user_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Json;
  created_at: string;
};

export type AdminReportRow = {
  id: string;
  week_number: number;
  reporting_date: string;
  published: boolean;
  evidence_rows: number;
  has_evidence: boolean;
  evidence_candidate_fields: number;
  evidence_grounded_fields: number;
  evidence_coverage_pct: number | null;
  uploaded_by: string | null;
  uploader_email: string | null;
  created_at: string;
};

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
  report_id: string | null;
  published: boolean | null;
  source_available: boolean;
};

// ---- Users -----------------------------------------------------------------

export const listAdminUsers = () => invokeAdmin<AdminUserRow[]>("list_users");
export const setUserAdminRole = (o: { data: { userId: string; makeAdmin: boolean } }) =>
  invokeAdmin<{ ok: true }>("set_user_role", o.data);
export const deleteAdminUser = (o: { data: { userId: string } }) =>
  invokeAdmin<{ ok: true }>("delete_user", o.data);

// ---- Overview / Logs -------------------------------------------------------

export const getAdminOverview = () => invokeAdmin<AdminOverview>("get_overview");
export const listAdminLogs = () => invokeAdmin<AdminLogRow[]>("list_logs");

// ---- Reports ---------------------------------------------------------------

export const listAdminReports = () => invokeAdmin<AdminReportRow[]>("list_reports");
export const setReportPublished = (o: { data: { id: string; published: boolean } }) =>
  invokeAdmin<{ ok: true }>("set_report_published", o.data);
export const deleteAdminReport = (o: { data: { id: string } }) =>
  invokeAdmin<{ ok: true }>("delete_report", o.data);

// ---- Documents -------------------------------------------------------------

export const listAdminDocuments = () => invokeAdmin<AdminDocumentRow[]>("list_documents");

export const createDocumentUploadUrl = (o: {
  data: { name: string; size_bytes: number; week_number?: number | null };
}) =>
  invokeAdmin<{
    bucket: string;
    storage_path: string;
    upload_url: string;
    token: string;
    file_type: string;
  }>("create_document_upload_url", o.data);

export const finalizeDocumentUpload = (o: {
  data: {
    name: string;
    file_type: string;
    size_bytes: number;
    storage_path: string;
    week_number?: number | null;
  };
}) => invokeAdmin<{ id: string }>("finalize_document", o.data);

export const getDocumentDownloadUrl = (o: { data: { storage_path: string } }) =>
  invokeAdmin<{ url: string }>("get_document_download_url", o.data);

export const setDocumentReport = (o: { data: { storage_path: string; report_id: string } }) =>
  invokeAdmin<{ ok: true }>("set_document_report", o.data);

export const updateReportReviewValues = (o: {
  data: { report_id: string; values: Record<string, Record<string, number | null>> };
}) => invokeAdmin<{ ok: true; updated: number }>("update_report_review_values", o.data);

export const publishDocumentReport = (o: { data: { storage_path: string; report_id: string } }) =>
  invokeAdmin<{ ok: true }>("publish_document_report", o.data);

export const deleteAdminDocument = (o: { data: { storage_path: string } }) =>
  invokeAdmin<{ ok: true; deletedReportId: string | null; weekNumber: number | null }>(
    "delete_document",
    o.data,
  );

// ---- Bootstrap -------------------------------------------------------------

export const enableRealtimeBootstrap = () =>
  invokeAdmin<{ ok: boolean; manual_sql: string | null; reason: string | null }>(
    "enable_realtime_bootstrap",
  );
