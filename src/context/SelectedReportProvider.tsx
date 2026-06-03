import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useDocuments, useWeeklyReports, type WeeklyReportRef } from "@/hooks/useReport";

// One selectable entry in the header dropdown. The dropdown is driven by the
// documents on the server (the uploaded files). A document that has been read
// into the dashboard carries its report_id; an unread one has report_id = null
// (selecting it shows the empty state until it's processed). Reports created by
// the direct "Upload Report" path that have no matching document are appended
// so they remain selectable too.
export type ReportEntry = {
  key: string;
  label: string;
  reportId: string | null;
  processed: boolean;
};

type Ctx = {
  entries: ReportEntry[];
  selectedKey: string | null;
  setSelectedKey: (key: string) => void;
  // Resolved from the selected entry — what the dashboard pages read.
  selectedReportId: string | null;
  selectedReport: WeeklyReportRef | null;
  // Back-compat for existing callers.
  reports: WeeklyReportRef[];
  setSelectedReportId: (id: string) => void;
  loading: boolean;
};

const SelectedReportContext = createContext<Ctx | null>(null);

function docLabel(name: string): string {
  // Drop the storage extension for display; keep the human name as uploaded.
  return name.replace(/\.(pptx|pdf|xlsx|xls)$/i, "");
}

export function SelectedReportProvider({ children }: { children: ReactNode }) {
  const { documents, loading: docsLoading } = useDocuments();
  const { reports, loading: reportsLoading } = useWeeklyReports();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const reportsSorted = useMemo(
    () => [...reports].sort((a, b) => (b.week_number ?? 0) - (a.week_number ?? 0)),
    [reports],
  );

  // Build the dropdown: documents first (newest first), then any report that
  // isn't linked to a document.
  const entries = useMemo<ReportEntry[]>(() => {
    const docs = [...documents].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const linkedReportIds = new Set(docs.map((d) => d.report_id).filter(Boolean) as string[]);

    const docEntries: ReportEntry[] = docs.map((d) => ({
      key: `doc:${d.storage_path}`,
      label: docLabel(d.name),
      reportId: d.report_id,
      processed: !!d.report_id,
    }));

    // Weeks already represented by a document (via its linked report) — don't
    // also list a bare "Week N" entry for them.
    const weeksWithDoc = new Set<number>();
    for (const d of docs) {
      if (!d.report_id) continue;
      const wk = reportsSorted.find((r) => r.id === d.report_id)?.week_number;
      if (wk != null) weeksWithDoc.add(wk);
    }

    // Orphan reports (no linked document, e.g. older "Upload Report" runs):
    // newest reporting_date first, then keep only ONE per week and skip weeks a
    // document already covers. This collapses the duplicate "Week N" entries
    // that earlier re-uploads of the same report left behind.
    const seenWeeks = new Set<number>();
    const orphanReportEntries: ReportEntry[] = [...reportsSorted]
      .filter((r) => !linkedReportIds.has(r.id))
      .sort((a, b) => ((a.reporting_date ?? "") < (b.reporting_date ?? "") ? 1 : -1))
      .filter((r) => {
        if (r.week_number == null) return true;
        if (weeksWithDoc.has(r.week_number) || seenWeeks.has(r.week_number)) return false;
        seenWeeks.add(r.week_number);
        return true;
      })
      .map((r) => ({
        key: `rep:${r.id}`,
        label: formatWeekLabel(r),
        reportId: r.id,
        processed: true,
      }));

    return [...docEntries, ...orphanReportEntries];
  }, [documents, reportsSorted]);

  // Default to the most recent processed entry (so the dashboard shows data);
  // fall back to the first entry if none are processed yet.
  useEffect(() => {
    if (entries.length === 0) {
      if (selectedKey !== null) setSelectedKey(null);
      return;
    }
    if (selectedKey === null || !entries.some((e) => e.key === selectedKey)) {
      const firstProcessed = entries.find((e) => e.processed);
      setSelectedKey((firstProcessed ?? entries[0]).key);
    }
  }, [entries, selectedKey]);

  const selectedEntry = useMemo(
    () => entries.find((e) => e.key === selectedKey) ?? null,
    [entries, selectedKey],
  );
  const selectedReportId = selectedEntry?.reportId ?? null;
  const selectedReport = useMemo(
    () => reportsSorted.find((r) => r.id === selectedReportId) ?? null,
    [reportsSorted, selectedReportId],
  );

  // Back-compat: select the entry that resolves to a given report id.
  const setSelectedReportId = (id: string) => {
    const entry = entries.find((e) => e.reportId === id);
    if (entry) setSelectedKey(entry.key);
  };

  return (
    <SelectedReportContext.Provider
      value={{
        entries,
        selectedKey,
        setSelectedKey,
        selectedReportId,
        selectedReport,
        reports: reportsSorted,
        setSelectedReportId,
        loading: docsLoading || reportsLoading,
      }}
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