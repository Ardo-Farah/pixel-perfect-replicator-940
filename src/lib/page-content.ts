// Page content read/write via the normal Supabase client (the user's JWT).
// page_content now has RLS policies (read = any signed-in user, write = admin),
// so this needs no service-role key and runs entirely against Supabase — the
// app host holds no secret for it.
import { supabase } from "@/lib/supabase";

export type ContentMap = Record<
  string,
  Record<string, { text: string | null; number: number | null }>
>;

export type ContentEntry = {
  section_key: string;
  field_key: string;
  value_text?: string | null;
  value_number?: number | null;
};

export async function getPageContent(pageKey: string): Promise<ContentMap> {
  const { data, error } = await supabase
    .from("page_content")
    .select("section_key, field_key, value_text, value_number")
    .eq("page_key", pageKey);
  if (error) {
    // page_content not in the API schema cache yet → fall back to defaults.
    if (/schema cache|PGRST205/.test(error.message)) return {};
    throw new Error(error.message);
  }
  const out: ContentMap = {};
  for (const r of (data ?? []) as Array<{
    section_key: string;
    field_key: string;
    value_text: string | null;
    value_number: number | null;
  }>) {
    out[r.section_key] = out[r.section_key] ?? {};
    out[r.section_key][r.field_key] = {
      text: r.value_text ?? null,
      number: r.value_number !== null && r.value_number !== undefined ? Number(r.value_number) : null,
    };
  }
  return out;
}

export async function upsertPageContent(pageKey: string, entries: ContentEntry[]) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const rows = entries.map((e) => ({
    page_key: pageKey,
    section_key: e.section_key,
    field_key: e.field_key,
    value_text: e.value_text ?? null,
    value_number: e.value_number ?? null,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("page_content")
    .upsert(rows, { onConflict: "page_key,section_key,field_key" });
  if (error) throw new Error(error.message);

  // Best-effort audit trail; never fail the save on a logging error.
  if (userId) {
    const { error: auditError } = await supabase.from("audit_log").insert({
      user_id: userId,
      action: "edit_content",
      table_name: "page_content",
      details: { page_key: pageKey, count: rows.length },
    });
    if (auditError) console.warn("audit_log insert failed (non-fatal):", auditError.message);
  }

  return { ok: true, count: rows.length };
}
