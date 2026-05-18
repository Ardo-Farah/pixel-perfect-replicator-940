import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSelectedReport } from "@/context/ReportProvider";

export function useLatestReportId() {
  const { reportId, weekNumber, loading } = useSelectedReport();
  return { reportId, weekNumber, loading };
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
