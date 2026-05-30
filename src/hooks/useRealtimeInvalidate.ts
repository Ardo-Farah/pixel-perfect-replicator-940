import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Subscribe to Postgres changes on the given tables and invalidate the
 * matching React Query keys so any open page re-fetches automatically.
 *
 * Pass the list of tables you want to watch. The hook tears the channel
 * down on unmount.
 */
export function useRealtimeInvalidate(tables: string[]) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!tables.length) return;

    const channel = supabase.channel(`realtime-${tables.join("-")}`);

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          // Broad invalidation — cheap, and ensures any consumer refetches.
          if (table === "documents") {
            qc.invalidateQueries({ queryKey: ["admin-documents"] });
            qc.invalidateQueries({ queryKey: ["admin-overview"] });
          } else if (table === "page_content") {
            qc.invalidateQueries({ queryKey: ["page-content"] });
            qc.invalidateQueries({ queryKey: ["admin-page-content"] });
          } else if (table === "weekly_reports") {
            qc.invalidateQueries({ queryKey: ["latest-report"] });
            qc.invalidateQueries({ queryKey: ["weekly-reports"] });
          } else {
            // section/data tables drive the dashboard
            qc.invalidateQueries({ queryKey: ["table-data", table] });
            qc.invalidateQueries({ queryKey: ["county-data", table] });
          }
        },
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // tables identity is stable per call site; join for dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, tables.join("|")]);
}
