import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Admin check backed by React Query so the result is cached across page
// navigations. Previously this was local useState that reset to null on every
// AppShell remount (each route renders its own AppShell), which made the
// "Admin Dashboard" link flicker/disappear when moving between pages. It also
// flipped to false on any transient query error; now an error keeps the last
// known value instead of hiding the link.

async function fetchIsAdmin(): Promise<boolean> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return false;
  const { data, error } = await supabase
    .from("user_roles" as never)
    .select("role")
    .eq("user_id", uid)
    .eq("role", "admin")
    .maybeSingle();
  // Throw on error so React Query retains the previous successful value rather
  // than overwriting a known-admin with false.
  if (error) throw new Error(error.message);
  return !!data;
}

export function useIsAdmin() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["is-admin"],
    queryFn: fetchIsAdmin,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  // Re-evaluate when the auth state changes (sign in/out, token refresh, user
  // switch) — invalidate so the cached value stays correct without flicker.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries({ queryKey: ["is-admin"] });
    });
    return () => subscription.unsubscribe();
  }, [qc]);

  return {
    isAdmin: q.data ?? false,
    // Only "loading" on the very first fetch with no cached value, so the link
    // doesn't blink off on subsequent navigations.
    loading: q.isLoading,
  };
}
