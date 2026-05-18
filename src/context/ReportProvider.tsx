import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type ReportRow = {
  id: string;
  week_number: number;
  reporting_date: string; // ISO date
};

type ReportContextValue = {
  reports: ReportRow[];
  selectedReportId: string | null;
  setSelectedReportId: (id: string) => void;
  loading: boolean;
};

const ReportContext = createContext<ReportContextValue | null>(null);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("weekly_reports" as never)
        .select("id, week_number, reporting_date")
        .eq("published", true)
        .order("week_number", { ascending: false });
      if (!mounted) return;
      if (error) {
        console.error("ReportProvider load error", error);
        setReports([]);
        setLoading(false);
        return;
      }
      const rows = (data ?? []) as ReportRow[];
      setReports(rows);
      setSelectedReportId((prev) => prev ?? rows[0]?.id ?? null);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<ReportContextValue>(
    () => ({ reports, selectedReportId, setSelectedReportId, loading }),
    [reports, selectedReportId, loading],
  );

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReportContext() {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error("useReportContext must be used within ReportProvider");
  return ctx;
}

export function useSelectedReport() {
  const { reports, selectedReportId, setSelectedReportId, loading } = useReportContext();
  const selected = reports.find((r) => r.id === selectedReportId) ?? null;
  return {
    reportId: selected?.id ?? null,
    weekNumber: selected?.week_number ?? null,
    reportingDate: selected?.reporting_date ?? null,
    reports,
    setSelectedReportId,
    loading,
  };
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(d: Date) {
  return `${ordinal(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatWeekRange(reportingDate: string): string {
  const end = new Date(reportingDate);
  if (isNaN(end.getTime())) return "";
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 6);
  return `${formatDate(start)} to ${formatDate(end)}`;
}
