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

  // Sort by week_number desc so the highest is first regardless of source order.
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

  const value: Ctx = {
    reports: sorted,
    selectedReport,
    selectedReportId,
    setSelectedReportId,
    loading,
  };

  return (
    <SelectedReportContext.Provider value={value}>{children}</SelectedReportContext.Provider>
  );
}

export function useSelectedReport() {
  const ctx = useContext(SelectedReportContext);
  if (!ctx) throw new Error("useSelectedReport must be used inside SelectedReportProvider");
  return ctx;
}

const ORDINALS = ["th", "st", "nd", "rd"];
function ordinal(n: number) {
  const v = n % 100;
  return n + (