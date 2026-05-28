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
  created_at: string;
};

export const listAdminReports = createServerFn({ method: "GET" })
  .middleware([requireAdminRole])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("weekly_reports")
      .select("id, week_number, reporting_date, published, created_at")
      .order("week_number", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({ ...r, uploaded_by: null })) as AdminReportRow[];
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
      target_type: "weekly_report",
      target_id: data.id,
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
      target_type: "weekly_report",
      target_id: data.id,
    });
    return { ok: true };
  });
