import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useWeeklyReports, type WeeklyReportRef } from "@/hooks/useReport";

type Ctx = {
  reports: WeeklyReportRef[];
  selectedReportId: string | null;
  selectedReport: WeeklyReportRef | null;
  setSelectedReportId: (id: string) => void;
  loading: boolean;
};

const SelectedReportContext = createContext<Ctx | null>(null);

export function SelectedReportProvider({ children }: { children: ReactNode }) {
  const { reports, loading } = useWeeklyReports();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Sort by week_number desc and default to highest week_number.
  const sorted = useMemo(
    () => [...reports].sort((a, b) => (b.week_number ?? 0) - (a.week_number ?? 0)),
    [reports],
  );

  useEffect(() => {
    if (selectedReportId === null && sorted.length > 0) {
      setSelectedReportId(sorted[0].id);
    }
  }, [sorted, selectedReportId]);

  const selectedReport =
    sorted.find((r) => r.id === selectedReportId) ?? null;

  return (
    <SelectedReportContext.Provider
      value={{ reports: sorted, selectedReportId, selectedReport, setSelectedReportId, loading }}
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

export function formatReportingDate(date: string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const day = d.getUTCDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" :
    day % 10 === 2 && day !== 12 ? "nd" :
    day % 10 === 3 && day !== 13 ? "rd" : "th";
  const month = d.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
  const year = d.getUTCFullYear();
  return `${day}${suffix} ${month} ${year}`;
}

export function formatReportLabel(r: WeeklyReportRef | null): string {
  if (!r) return "Select week";
  return `Week ${r.week_number}: ${formatReportingDate(r.reporting_date)}`;
}
