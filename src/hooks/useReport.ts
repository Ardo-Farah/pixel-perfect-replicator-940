import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Shared query-option factories so the hooks and the startup prefetcher
// (see _authenticated.tsx) use byte-identical query keys and fetchers — that
// is what makes a prefetched page render with zero flicker on first visit.

export const tableDataQuery = (table: string, reportId: string | null) =>
  queryOptions({
    queryKey: ["table-data", table, reportId],
    enabled: reportId !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table as never)
        .select("*")
        .eq("report_id", reportId as string)
        .single();
      if (error) {
        console.error(`tableData(${table}) error`, error);
        // Throw so react-query surfaces an error state for UI retry handling.
        throw new Error(error.message || "Failed to load data");
      }
      return data ?? null;
    },
  });

export const countyDataQuery = (table: string, reportId: string | null) =>
  queryOptions({
    queryKey: ["county-data", table, reportId],
    enabled: reportId !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table as never)
        .select("*")
        .eq("report_id", reportId as string);
      if (error) {
        console.error(`countyData(${table}) error`, error);
        throw new Error(error.message || "Failed to load data");
      }
      return (data ?? []) as unknown[];
    },
  });

export type WeeklyReportRef = {
  id: string;
  week_number: number;
  reporting_date: string | null;
};

const latestReportQuery = queryOptions({
  queryKey: ["latest-report"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("weekly_reports" as never)
      .select("id, week_number")
      .eq("published", true)
      .order("week_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("useLatestReportId error", error);
      return null;
    }
    return (data as { id: string; week_number: number } | null) ?? null;
  },
});

const weeklyReportsQuery = queryOptions({
  queryKey: ["weekly-reports"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("weekly_reports" as never)
      .select("id, week_number, reporting_date")
      .eq("published", true)
      .order("week_number", { ascending: false });
    if (error) {
      console.error("useWeeklyReports error", error);
      return [] as WeeklyReportRef[];
    }
    return (data as WeeklyReportRef[]) ?? [];
  },
});

// v5: isLoading === isPending && isFetching — true only on the FIRST fetch with
// no cached data (skeleton shown once). On a cached revisit it is false, so the
// page renders data immediately while any stale refetch happens silently.

export function useLatestReportId() {
  const q = useQuery(latestReportQuery);
  return {
    reportId: q.data?.id ?? null,
    weekNumber: q.data?.week_number ?? null,
    loading: q.isLoading,
  };
}

export function useTableData<T>(table: string, reportId: string | null) {
  const q = useQuery(tableDataQuery(table, reportId));
  return {
    data: (q.data ?? null) as T | null,
    loading: reportId !== null && q.isLoading,
    error: q.error as Error | null,
    refetch: () => q.refetch(),
  };
}

export function useCountyData<T>(table: string, reportId: string | null) {
  const q = useQuery(countyDataQuery(table, reportId));
  return {
    data: (q.data ?? []) as T[],
    loading: reportId !== null && q.isLoading,
    error: q.error as Error | null,
    refetch: () => q.refetch(),
  };
}

export function useWeeklyReports() {
  const q = useQuery(weeklyReportsQuery);
  return {
    reports: q.data ?? [],
    loading: q.isLoading,
  };
}

export type DocumentRef = {
  id: string;
  name: string;
  storage_path: string;
  week_number: number | null;
  report_id: string | null;
  created_at: string;
};

const documentsQuery = queryOptions({
  queryKey: ["documents-selector"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("documents" as never)
      .select("id, name, storage_path, week_number, report_id, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("useDocuments error", error);
      return [] as DocumentRef[];
    }
    return (data as DocumentRef[]) ?? [];
  },
});

export function useDocuments() {
  const q = useQuery(documentsQuery);
  return {
    documents: q.data ?? [],
    loading: q.isLoading,
  };
}
