import { useEffect } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { enableRealtimeBootstrap } from "@/lib/admin-bootstrap.functions";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const BOOTSTRAP_FLAG = "admin-realtime-bootstrap-v1";

function AdminLayout() {
  // Keep admin lists in sync the moment any admin (including this one)
  // uploads, deletes, or edits anything.
  useRealtimeInvalidate(["documents", "page_content", "weekly_reports"]);

  // Try once per browser session to enable Postgres realtime on the external
  // project. If the project lacks an `exec_sql` RPC, surface the SQL the
  // admin needs to paste into the SQL editor once.
  const bootstrap = useServerFn(enableRealtimeBootstrap);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(BOOTSTRAP_FLAG) === "done") return;
    bootstrap()
      .then((res) => {
        if (res.ok) {
          localStorage.setItem(BOOTSTRAP_FLAG, "done");
        } else if (res.manual_sql) {
          // Mark done so we don't nag every load — admin can re-run from console.
          localStorage.setItem(BOOTSTRAP_FLAG, "done");
          console.warn(
            "[admin] Live updates require running this SQL once in Supabase:\n\n" +
              res.manual_sql,
          );
        }
      })
      .catch((e) => {
        console.warn("[admin] realtime bootstrap failed", e);
      });
  }, [bootstrap]);

  return <Outlet />;
}

