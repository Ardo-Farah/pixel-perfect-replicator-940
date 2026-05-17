import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/lib/supabase";

// Registered as a global functionMiddleware in src/start.ts so the browser
// attaches the user's bearer token to every serverFn RPC.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
