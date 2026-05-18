import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SelectedReportProvider, useSelectedReport } from "@/context/SelectedReportProvider";
import { countyDataQuery, tableDataQuery } from "@/hooks/useReport";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fallback = window.setTimeout(() => {
      if (!mounted) return;
      setAuthed(false);
      setChecked(true);
    }, 3500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setAuthed(!!session);
      setChecked(true);
      window.clearTimeout(fallback);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.session);
      setChecked(true);
      window.clearTimeout(fallback);
    }).catch(() => {
      if (!mounted) return;
      setAuthed(false);
      setChecked(true);
      window.clearTimeout(fallback);
    });

    return () => {
      mounted = false;
      window.clearTimeout(fallback);
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
      <ReportPrefetcher />
      <Outlet />
    </SelectedReportProvider>
  );
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
