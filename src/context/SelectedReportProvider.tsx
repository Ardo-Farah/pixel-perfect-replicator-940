import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useWeeklyReports, type WeeklyReportRef } from "@/hooks/useReport";

type Ctx = {
  reports: WeeklyReportRef[];
  selectedReport: WeeklyReportRef | null;
  selectedReportId: string | null;
  setSelectedReportId: (id: string) => void;
  loading: boolean;
};

const SelectedReportContext = createContext<Ctx | null>(null);

export function SelectedReportProvider({ children }: { children: ReactNode }) {
  const { reports, loading } = useWeeklyReports();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...reports].sort((a, b) => (b.week_number ?? 0) - (a.week_number ?? 0)),
    [reports],
  );

  useEffect(() => {
    if (selectedReportId === null && sorted.length > 0) {
      setSelectedReportId(sorted[0].id);
    }
  }, [sorted, selectedReportId]);

  const selectedReport = useMemo(
    () => sorted.find((r) => r.id === selectedReportId) ?? null,
    [sorted, selectedReportId],
  );

  return (
    <SelectedReportContext.Provider
      value={{ reports: sorted, selectedReport, selectedReportId, setSelectedReportId, loading }}
    >
      {children}
    </SelectedReportContext.Provider>
  );
}

export function useSelectedReport() {
  const ctx = useContext(SelectedReportContext);
  if (!ctx) throw new Error("useSelectedReport must be used inside SelectedReportProvider");
  return ctx;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return n + "th";
  switch (n % 10) {
    case 1: return n + "st";
    case 2: return n + "nd";
    case 3: return n + "rd";
    default: return n + "th";
  }
}

function fmtDate(d: Date): string {
  return `${ordinal(d.getUTCDate())} ${FULL_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatWeekRange(reportingDate: string | null): string {
  if (!reportingDate) return "";
  const start = new Date(reportingDate);
  if (isNaN(start.getTime())) return "";
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return `${fmtDate(start)} to ${fmtDate(end)}`;
}

export function formatWeekLabel(report: WeeklyReportRef): string {
  const range = formatWeekRange(report.reporting_date);
  return range ? `Week ${report.week_number}: ${range}` : `Week ${report.week_number}`;
}

// silence unused warning for short MONTHS (kept for potential future short-format use)
void MONTHS;