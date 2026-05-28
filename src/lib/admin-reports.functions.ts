import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminRole } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/lib/supabase-admin.server";

export type AdminReportRow = {
  id: string;
  week_number: number;
  reporting_date: string;
  published: boolean;
  uploaded_by: string | null;
  uploader_email: string | null;
  created_at: string;
};

export const listAdminReports = createServerFn({ method: "GET" })
  .middleware([requireAdminRole])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("weekly_reports")
      .select("id, week_number, reporting_date, published, uploaded_by, created_at")
      .order("week_number", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = data ?? [];

    const ids = Array.from(
      new Set(rows.map((r) => r.uploaded_by).filter((v): v is string => !!v)),
    );
    const emailById = new Map<string, string>();
    if (ids.length) {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      for (const u of authData?.users ?? []) {
        if (ids.includes(u.id)) emailById.set(u.id, u.email ?? "");
      }
    }

    return rows.map((r) => ({
      ...r,
      uploader_email: r.uploaded_by ? emailById.get(r.uploaded_by) ?? null : null,
    })) as AdminReportRow[];
  });

export const setReportPublished = createServerFn({ method: "POST" })
  .middleware([requireAdminRole])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), published: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("weekly_reports")
      .update({ published: data.published })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: data.published ? "publish_report" : "unpublish_report",
      table_name: "weekly_report",
      report_id: data.id,
    });
    return { ok: true };
  });

export const deleteAdminReport = createServerFn({ method: "POST" })
  .middleware([requireAdminRole])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("weekly_reports")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "delete_report",
      table_name: "weekly_report",
      report_id: data.id,
    });
    return { ok: true };
  });
