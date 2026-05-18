import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useLatestReportId() {
  const [state, setState] = useState<{
    reportId: string | null;
    weekNumber: number | null;
    loading: boolean;
  }>({ reportId: null, weekNumber: null, loading: true });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("weekly_reports" as never)
        .select("id, week_number")
        .eq("published", true)
        .order("reporting_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        console.error("useLatestReportId error", error);
        setState({ reportId: null, weekNumber: null, loading: false });
        return;
      }
      const row = data as { id: string; week_number: number } | null;
      setState({
        reportId: row?.id ?? null,
        weekNumber: row?.week_number ?? null,
        loading: false,
      });
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

export function useTableData<T>(table: string, reportId: string | null) {
  const [state, setState] = useState<{ data: T | null; loading: boolean }>({
    data: null,
    loading: reportId !== null,
  });

  useEffect(() => {
    if (!reportId) {
      setState({ data: null, loading: false });
      return;
    }
    let mounted = true;
    setState({ data: null, loading: true });
    (async () => {
      const { data, error } = await supabase
        .from(table as never)
        .select("*")
        .eq("report_id", reportId)
        .single();
      if (!mounted) return;
      if (error) {
        console.error(`useTableData(${table}) error`, error);
        setState({ data: null, loading: false });
        return;
      }
      setState({ data: (data as T) ?? null, loading: false });
    })();
    return () => {
      mounted = false;
    };
  }, [table, reportId]);

  return state;
}

export function useCountyData<T>(table: string, reportId: string | null) {
  const [state, setState] = useState<{ data: T[]; loading: boolean }>({
    data: [],
    loading: reportId !== null,
  });

  useEffect(() => {
    if (!reportId) {
      setState({ data: [], loading: false });
      return;
    }
    let mounted = true;
    setState({ data: [], loading: true });
    (async () => {
      const { data, error } = await supabase
        .from(table as never)
        .select("*")
        .eq("report_id", reportId);
      if (!mounted) return;
      if (error) {
        console.error(`useCountyData(${table}) error`, error);
        setState({ data: [], loading: false });
        return;
      }
      setState({ data: (data as T[]) ?? [], loading: false });
    })();
    return () => {
      mounted = false;
    };
  }, [table, reportId]);

  return state;
}

export type WeeklyReportRef = {
  id: string;
  week_number: number;
  reporting_date: string | null;
};

export function useWeeklyReports() {
  const [state, setState] = useState<{ reports: WeeklyReportRef[]; loading: boolean }>({
    reports: [],
    loading: true,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("weekly_reports" as never)
        .select("id, week_number, reporting_date")
        .eq("published", true)
        .order("reporting_date", { ascending: false });
      if (!mounted) return;
      if (error) {
        console.error("useWeeklyReports error", error);
        setState({ reports: [], loading: false });
        return;
      }
      setState({ reports: (data as WeeklyReportRef[]) ?? [], loading: false });
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
