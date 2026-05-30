import { createServerFn } from "@tanstack/react-start";
import { requireAdminRole } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/lib/supabase-admin.server";

/**
 * Idempotent: enables Postgres realtime on every table the dashboard reads.
 * Safe to call multiple times — errors like "relation already member of
 * publication" are swallowed.
 *
 * The Lovable migration tool only reaches the internal Cloud project, so this
 * runs the equivalent SQL against the EXTERNAL Supabase project using the
 * service-role key.
 */
const REALTIME_TABLES = [
  "weekly_reports",
  "documents",
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
  "page_content",
];

export const enableRealtimeBootstrap = createServerFn({ method: "POST" })
  .middleware([requireAdminRole])
  .handler(async () => {
    // Supabase JS doesn't expose raw SQL. Try a SQL-exec RPC if the project
    // has one; otherwise fall back to no-op and report the SQL the user
    // needs to run once in the SQL editor.
    const sql = [
      ...REALTIME_TABLES.map(
        (t) => `ALTER TABLE public.${t} REPLICA IDENTITY FULL;`,
      ),
      `ALTER PUBLICATION supabase_realtime ADD TABLE ${REALTIME_TABLES
        .map((t) => `public.${t}`)
        .join(", ")};`,
    ].join("\n");

    const { error } = await (supabaseAdmin.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>) ("exec_sql", { sql });

    if (error) {
      // Most projects don't ship an `exec_sql` RPC. Surface a clear instruction
      // for the admin to copy/paste the SQL once.
      return {
        ok: false,
        manual_sql: sql,
        reason: error.message,
      };
    }
    return { ok: true, manual_sql: null, reason: null };
  });
