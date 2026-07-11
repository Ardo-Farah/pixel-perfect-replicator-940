import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const validation = read("src/lib/upload-validation.ts");
const provider = read("src/context/UploadProvider.tsx");
const documents = read("src/routes/admin/documents.tsx");
const reports = read("src/routes/admin/reports.tsx");
const adminClient = read("src/lib/admin-api.ts");
const adminApi = read("supabase/functions/admin-api/index.ts");
const processUpload = read("supabase/functions/process-upload/index.ts");
const errorMessages = read("src/lib/error-messages.ts");
const supabaseClient = read("src/lib/supabase.ts");
const supabaseConfig = read("supabase/config.toml");
const chatFunction = read("supabase/functions/chat/index.ts");
const safePublishMigration = read("supabase/migrations/20260711090000_safe_report_publish.sql");
const safeDraftMigration = read("supabase/migrations/20260711100000_allow_safe_draft_replacement.sql");

for (const ext of ["pptx", "pdf", "xlsx", "xls"]) {
  assert.ok(validation.includes(`"${ext}"`), `report upload validation should allow ${ext}`);
}
assert.ok(validation.includes('"docx"'), "document library validation should allow docx storage");
assert.ok(validation.includes("50 * 1024 * 1024"), "frontend upload validation should cap files at 50 MB");
assert.ok(adminApi.includes("50 * 1024 * 1024"), "admin API should enforce the same 50 MB cap");
assert.ok(processUpload.includes("50 * 1024 * 1024"), "process-upload should enforce the same 50 MB cap");

assert.ok(
  provider.indexOf("validateReportUploadFile(file)") < provider.indexOf(".upload(path, file"),
  "report files should be validated before storage upload",
);
assert.ok(provider.includes("validation.safeName"), "report storage paths should use sanitized filenames");

assert.ok(
  documents.indexOf("validateDocumentLibraryFile(file)") < documents.indexOf("createUrl({"),
  "admin document files should be validated before signed upload URL creation",
);
assert.ok(documents.includes("requiresReviewAcknowledgement(readSummary)"), "admin publish gate should require explicit acknowledgement for risky drafts");
assert.ok(documents.includes("reviewAcknowledged"), "admin review card should track acknowledgement state");
assert.ok(documents.includes("Confirm the review checklist before publishing"), "publish gate should explain missing acknowledgement");
assert.ok(documents.includes("publishDocumentReport"), "document review publish should use the atomic publish/link admin action");
assert.ok(documents.includes("updateReportReviewValues"), "document review should save edited figures before publishing");
assert.ok(documents.includes("Edit figures"), "document review should expose an edit mode for extracted figures");
assert.ok(documents.includes("reviewValuesToPayload"), "document review should convert edited values into a backend payload");
assert.ok(documents.includes("storagePath: d.storage_path"), "admin document read-in should process the stored document without creating upload duplicates");
assert.ok(adminApi.includes('case "publish_document_report"'), "admin API should expose atomic document publish action");
assert.ok(adminApi.includes('case "update_report_review_values"'), "admin API should expose reviewed-value editing");
assert.ok(adminApi.includes("REVIEW_VALUE_FIELDS"), "admin API should whitelist editable review fields");
assert.ok(adminApi.includes("review_edit_report_values"), "admin API should audit reviewed-value edits");
assert.ok(adminApi.includes('o.path.startsWith("documents/")'), "admin documents list should hide report-processing upload copies");
assert.ok(adminApi.includes("legacy dashboard report"), "admin documents should include reports whose source document is unavailable");
assert.ok(adminApi.includes("source_available: false"), "legacy reports should never pretend a source file can be downloaded");
assert.ok(documents.includes("Manage report"), "legacy report cards should link to report management");
assert.ok(adminApi.includes("assertReportHasEvidence(admin, reportId)"), "atomic document publish should require source evidence");
assert.ok(adminApi.includes("assertReportHasEvidence(admin, id)"), "direct report publish should require source evidence");
assert.ok(adminClient.includes("evidence_rows: number"), "admin reports client type should include evidence row counts");
assert.ok(adminClient.includes("has_evidence: boolean"), "admin reports client type should include evidence status");
assert.ok(adminClient.includes("evidence_coverage_pct: number | null"), "admin reports client type should include evidence coverage");
assert.ok(adminApi.includes('from("report_extraction_evidence")'), "admin reports list should read extraction evidence counts");
assert.ok(adminApi.includes("getReportEvidenceStats(admin, reportIds)"), "admin reports list should include persistent evidence quality stats");
assert.ok(adminApi.includes("stats.coverage_pct < 75"), "admin publish guard should block weakly grounded reports");
assert.ok(reports.includes("r.has_evidence"), "admin reports page should surface evidence state");
assert.ok(reports.includes("!r.published && !isReportPublishable(r)"), "admin reports page should block unsafe draft publishing");
assert.ok(reports.includes("evidence_coverage_pct"), "admin reports page should show evidence coverage");
assert.ok(adminApi.includes("DOCUMENT_LIBRARY_EXTENSIONS.has(ext)"), "admin API should reject unsupported document types");
assert.ok(
  processUpload.indexOf("REPORT_UPLOAD_EXTENSIONS.has(extension)") < processUpload.indexOf(".download(file_path)"),
  "process-upload should reject unsupported report types before storage download",
);
assert.ok(processUpload.includes('file_path.startsWith("documents/")'), "process-upload should allow admin library documents");
assert.ok(processUpload.includes("canProcessLibraryDocument"), "process-upload should gate library document processing");
assert.ok(
  processUpload.indexOf("bytes.byteLength > MAX_UPLOAD_BYTES") < processUpload.indexOf("extractPptxText(bytes"),
  "process-upload should reject oversized files before parsing",
);
assert.ok(errorMessages.includes("PPTX, PDF, XLSX, or XLS"), "unsupported-type error should match supported report formats");

assert.ok(supabaseConfig.includes('project_id = "xewepnpqhwxsqiqhbfyr"'), "Supabase CLI should target the production project");
assert.equal(supabaseClient.includes("xewepnpqhwxsqiqhbfyr.supabase.co"), false, "client must not silently fall back to a hardcoded project");
assert.ok(supabaseClient.includes("Supabase is not configured"), "missing Lovable environment variables should fail clearly");
assert.ok(processUpload.includes('crypto.subtle.digest("SHA-256", bytes)'), "uploads should be identified by source hash");
assert.equal(processUpload.includes('.delete().eq("week_number", resolved_week)'), false, "processing must not delete the current weekly report");
assert.ok(processUpload.includes("writeErrors.length > 0"), "partial draft writes should fail and clean up");
assert.ok(adminApi.includes('rpc("publish_reviewed_report"'), "publishing should use the atomic database RPC");
assert.ok(safePublishMigration.includes("weekly_reports_one_published_week_idx"), "database should enforce one published report per week");
assert.ok(safeDraftMigration.includes("DROP CONSTRAINT IF EXISTS weekly_reports_week_number_reporting_date_key"), "safe replacement must allow a same-week draft beside the published report");
assert.ok(safePublishMigration.includes("read_evidence_admin_only"), "draft evidence should be admin-only");
assert.ok(safePublishMigration.includes("read_published_or_admin"), "report data should hide drafts from ordinary users");
assert.ok(chatFunction.includes('DEFAULT_MODEL = "claude-sonnet-5"'), "chat should use the current Claude model");
assert.ok(chatFunction.includes("configuredModel()"), "chat should normalize stale model configuration");
console.log("upload validation verification passed");
