import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        if (mounted) navigate({ to: "/login", search: { redirect: "/admin" } });
        return;
      }
      const { data, error } = await supabase
        .from("user_roles" as never)
        .select("role")
        .eq("user_id", sess.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!mounted) return;
      if (error || !data) {
        setState("denied");
        return;
      }
      setState("ok");
    };
    check();
  }, [navigate]);

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-on-surface-variant">Verifying admin access…</div>
      </div>
    );
  }
  if (state === "denied") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-6 text-center">
        <span className="material-symbols-outlined text-error" style={{ fontSize: 56 }}>block</span>
        <h1 className="text-headline-sm text-primary">Admin access required</h1>
        <p className="text-on-surface-variant max-w-md">
          Your account is signed in, but does not have admin privileges. Contact a system administrator if you believe this is an error.
        </p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return <Outlet />;
}
