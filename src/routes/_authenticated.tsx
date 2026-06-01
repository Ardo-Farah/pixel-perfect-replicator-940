import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SelectedReportProvider, useSelectedReport } from "@/context/SelectedReportProvider";
import { countyDataQuery, tableDataQuery } from "@/hooks/useReport";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const finishAuthCheck = (hasSession: boolean) => {
      if (!mounted) return;
      setAuthed(hasSession);
      setChecked(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      finishAuthCheck(!!session);
    });

    supabase.auth.getSession().then(({ data }) => {
      finishAuthCheck(!!data.session);
    }).catch(() => {
      finishAuthCheck(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (checked && !authed) {
      navigate({
        to: "/login",
        search: { redirect: typeof window !== "undefined" ? window.location.pathname : "/" },
      });
    }
  }, [checked, authed, navigate]);

  if (!checked || !authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-on-surface-variant">Loading…</div>
      </div>
    );
  }

  return (
    <SelectedReportProvider>
      <RealtimeSync />
      <ReportPrefetcher />
      <Outlet />
    </SelectedReportProvider>
  );
}

// Subscribes to all dashboard-relevant tables so admin edits show up live
// without requiring a page refresh.
function RealtimeSync() {
  useRealtimeInvalidate([
    "page_content",
    "documents",
    "weekly_reports",
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
  ]);
  return null;
}

// Warms the React Query cache for every page's tables as soon as the selected
// (default: most-recent) report is known, so the first navigation to any page
// is instant. prefetchQuery respects staleTime, so this never double-fetches.
function ReportPrefetcher() {
  const { selectedReportId } = useSelectedReport();
  const qc = useQueryClient();

  useEffect(() => {
    if (!selectedReportId) return;
    const single = [
      "report_summary",
      "mpox_data",
      "measles_data",
      "floods_data",
      "idsr_data",
      "nutrition_data",
    ];
    const arr = [
      "mpox_counties",
      "mpox_demographics",
      "measles_counties",
      "idsr_counties",
      "nutrition_counties",
      "anthrax_data",
    ];
    single.forEach((t) => qc.prefetchQuery(tableDataQuery(t, selectedReportId)));
    arr.forEach((t) => qc.prefetchQuery(countyDataQuery(t, selectedReportId)));
  }, [selectedReportId, qc]);

  return null;
}
