// Gate server functions to admins only.
// Extends requireSupabaseAuth by calling public.has_role(uid, 'admin').
import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/lib/auth-middleware";

export const requireAdminRole = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (error) throw new Error(`Role check failed: ${error.message}`);
    if (!data) throw new Error("Forbidden: admin role required");
    return next({ context });
  });
