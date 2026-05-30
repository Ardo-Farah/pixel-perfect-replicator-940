import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminRole } from "@/lib/admin-middleware";
import { requireSupabaseAuth } from "@/lib/auth-middleware";
import { supabaseAdmin } from "@/lib/supabase-admin.server";
import { findField, PAGE_KEYS, REGISTRY } from "@/lib/content-registry";

export type ContentMap = Record<string, Record<string, { text: string | null; number: number | null }>>;

const isSchemaCacheMiss = (message: string) =>
  message.includes("Could not find the table 'public.page_content' in the schema cache") ||
  message.includes("PGRST205");

export const getPageContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ page_key: z.enum(PAGE_KEYS) }).parse(input),
  )
  .handler(async ({ data }): Promise<ContentMap> => {
    const { data: rows, error } = await supabaseAdmin
      .from("page_content")
      .select("section_key, field_key, value_text, value_number")
      .eq("page_key", data.page_key);
    if (error) {
      if (isSchemaCacheMiss(error.message)) {
        console.warn("page_content is not available in the API schema cache yet; using defaults.");
        return {};
      }
      throw new Error(error.message);
    }
    const out: ContentMap = {};
    for (const r of rows ?? []) {
      out[r.section_key] = out[r.section_key] ?? {};
      out[r.section_key][r.field_key] = {
        text: r.value_text ?? null,
        number: r.value_number !== null && r.value_number !== undefined ? Number(r.value_number) : null,
      };
    }
    return out;
  });

const EntrySchema = z.object({
  section_key: z.string().min(1).max(64),
  field_key: z.string().min(1).max(64),
  value_text: z.string().max(10_000).nullable().optional(),
  value_number: z.number().finite().nullable().optional(),
});

export const upsertPageContent = createServerFn({ method: "POST" })
  .middleware([requireAdminRole])
  .inputValidator((input) =>
    z
      .object({
        page_key: z.enum(PAGE_KEYS),
        entries: z.array(EntrySchema).min(1).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Validate each entry against the registry
    for (const e of data.entries) {
      const def = findField(data.page_key, e.section_key, e.field_key);
      if (!def) throw new Error(`Unknown field: ${data.page_key}/${e.section_key}/${e.field_key}`);
      if (def.kind === "url" && e.value_text) {
        try {
          new URL(e.value_text);
        } catch {
          throw new Error(`Invalid URL for ${e.field_key}`);
        }
      }
    }

    const rows = data.entries.map((e) => ({
      page_key: data.page_key,
      section_key: e.section_key,
      field_key: e.field_key,
      value_text: e.value_text ?? null,
      value_number: e.value_number ?? null,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from("page_content")
      .upsert(rows, { onConflict: "page_key,section_key,field_key" });
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "edit_content",
      target_type: "page_content",
      target_id: data.page_key,
      metadata: { count: rows.length },
    });

    return { ok: true, count: rows.length };
  });

export const getAdminContentIndex = createServerFn({ method: "GET" })
  .middleware([requireAdminRole])
  .handler(async () => {
    return REGISTRY;
  });
