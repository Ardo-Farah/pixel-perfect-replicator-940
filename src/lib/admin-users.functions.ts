import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminRole } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/lib/supabase-admin.server";

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
  created_at: string;
  last_sign_in_at: string | null;
};

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireAdminRole])
  .handler(async () => {
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (authError) throw new Error(authError.message);

    const userIds = authData.users.map((u) => u.id);

    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", userIds),
    ]);

    const nameById = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]));
    const adminIds = new Set(
      (roles ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id),
    );

    return authData.users.map<AdminUserRow>((u) => ({
      id: u.id,
      email: u.email ?? "",
      full_name: nameById.get(u.id) ?? (u.user_metadata as any)?.full_name ?? "",
      role: adminIds.has(u.id) ? "admin" : "user",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }));
  });

export const setUserAdminRole = createServerFn({ method: "POST" })
  .middleware([requireAdminRole])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), makeAdmin: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.makeAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: "admin" });
      // ignore duplicate (already admin)
      if (error && !/duplicate|unique/i.test(error.message)) {
        throw new Error(error.message);
      }
    } else {
      if (data.userId === context.userId) {
        throw new Error("You cannot revoke your own admin access.");
      }
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: data.makeAdmin ? "grant_admin" : "revoke_admin",
      target_type: "user",
      target_id: data.userId,
    });
    return { ok: true };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireAdminRole])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) {
      throw new Error("You cannot delete your own account.");
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "delete_user",
      target_type: "user",
      target_id: data.userId,
    });
    return { ok: true };
  });
