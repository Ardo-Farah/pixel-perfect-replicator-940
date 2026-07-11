import { supabase } from "@/lib/supabase";
import type { WeeklyReportRef } from "@/hooks/useReport";

type Row = Record<string, unknown>;

type SummaryData = {
  summary: Row | null;
  mpox: Row | null;
  measles: Row | null;
  idsr: Row | null;
  nutrition: Row | null;
  ebola: Row[];
  cholera: Row[];
  dengue: Row[];
};

const WHO_BLUE = [0, 32, 92] as const;
const WHO_SKY = [0, 154, 222] as const;
const LIGHT_BLUE = [232, 245, 252] as const;
const TEXT = [31, 41, 55] as const;
const MUTED = [92, 105, 120] as const;

function value(row: Row | null, key: string): string {
  const raw = row?.[key];
  if (raw === null || raw === undefined || raw === "") return "-";
  if (typeof raw === "number") return raw.toLocaleString("en-KE");
  return String(raw);
}

function total(rows: Row[], key: string): string {
  const result = rows.reduce((sum, row) => {
    const number = Number(row[key] ?? 0);
    return sum + (Number.isFinite(number) ? number : 0);
  }, 0);
  return result.toLocaleString("en-KE");
}

function counties(rows: Row[]): string {
  return new Set(
    rows.map((row) => String(row.county ?? "").trim()).filter(Boolean),
  ).size.toLocaleString("en-KE");
}

function reportPeriod(report: WeeklyReportRef): string {
  if (!report.reporting_date) return `Epidemiological week ${report.week_number}`;
  const date = new Date(`${report.reporting_date}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return `Epidemiological week ${report.week_number}`;
  return `Epidemiological week ${report.week_number} | ${date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })}`;
}

async function loadSummaryData(reportId: string): Promise<SummaryData> {
  const single = async (table: string): Promise<Row | null> => {
    const { data, error } = await supabase
      .from(table as never)
      .select("*")
      .eq("report_id", reportId)
      .maybeSingle();
    if (error) throw new Error(`${table}: ${error.message}`);
    return (data as Row | null) ?? null;
  };

  const many = async (table: string): Promise<Row[]> => {
    const { data, error } = await supabase
      .from(table as never)
      .select("*")
      .eq("report_id", reportId);
    if (error) throw new Error(`${table}: ${error.message}`);
    return (data as Row[] | null) ?? [];
  };

  const [summary, mpox, measles, idsr, nutrition, ebola, cholera, dengue] = await Promise.all([
    single("report_summary"),
    single("mpox_data"),
    single("measles_data"),
    single("idsr_data"),
    single("nutrition_data"),
    many("ebola_data"),
    many("cholera_data"),
    many("dengue_data"),
  ]);

  return { summary, mpox, measles, idsr, nutrition, ebola, cholera, dengue };
}

export async function downloadSummaryPdf(reportId: string, report: WeeklyReportRef): Promise<void> {
  const [{ jsPDF }, data] = await Promise.all([import("jspdf"), loadSummaryData(reportId)]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  const addPageHeader = (continuation = false) => {
    pdf.setFillColor(...WHO_BLUE);
    pdf.rect(0, 0, pageWidth, 29, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("WHO KENYA", margin, 12);
    pdf.setFontSize(11);
    pdf.text("Weekly Health Emergencies Summary", margin, 20);
    if (continuation) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("Continued", pageWidth - margin, 20, { align: "right" });
    }
    y = 38;
  };

  const ensureSpace = (height: number) => {
    if (y + height <= pageHeight - 17) return;
    pdf.addPage();
    addPageHeader(true);
  };

  const section = (title: string, rows: Array<[string, string]>) => {
    const rowHeight = 8;
    const blockHeight = 12 + rows.length * rowHeight;
    ensureSpace(blockHeight);
    pdf.setFillColor(...LIGHT_BLUE);
    pdf.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, "F");
    pdf.setTextColor(...WHO_BLUE);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(title.toUpperCase(), margin + 3, y + 6);
    y += 12;

    rows.forEach(([label, metric], index) => {
      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, y - 1.5, contentWidth, rowHeight, "F");
      }
      pdf.setTextColor(...TEXT);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(label, margin + 3, y + 3.5);
      pdf.setFont("helvetica", "bold");
      pdf.text(metric, pageWidth - margin - 3, y + 3.5, { align: "right" });
      y += rowHeight;
    });
    y += 4;
  };

  addPageHeader();
  pdf.setTextColor(...WHO_BLUE);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(`Health Emergency Update - Week ${report.week_number}`, margin, y);
  y += 7;
  pdf.setTextColor(...MUTED);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(reportPeriod(report), margin, y);
  pdf.text(`Generated ${new Date().toLocaleString("en-KE")}`, pageWidth - margin, y, {
    align: "right",
  });
  y += 10;

  section("Overall emergency picture", [
    ["New events", value(data.summary, "new_events")],
    ["Ongoing outbreaks", value(data.summary, "outbreaks")],
    ["Grade 1 emergencies", value(data.summary, "grade_1")],
    ["Grade 2 emergencies", value(data.summary, "grade_2")],
    ["Grade 3 emergencies", value(data.summary, "grade_3")],
  ]);

  section("Mpox", [
    ["Cumulative cases", value(data.mpox, "cumulative_cases")],
    ["New cases this week", value(data.mpox, "new_cases_this_week")],
    ["Deaths", value(data.mpox, "deaths")],
    ["Case fatality ratio", value(data.mpox, "cfr")],
    ["Counties affected", value(data.mpox, "counties_affected")],
  ]);

  section("Measles", [
    ["Total cases", value(data.measles, "total_cases")],
    ["Confirmed cases", value(data.measles, "confirmed")],
    ["Suspected cases", value(data.measles, "suspected")],
    ["Counties affected", value(data.measles, "counties_affected")],
  ]);

  section("Other priority diseases", [
    ["Ebola cases", total(data.ebola, "cases")],
    ["Ebola deaths", total(data.ebola, "deaths")],
    ["Ebola affected counties", counties(data.ebola)],
    ["Cholera cases", total(data.cholera, "cases")],
    ["Cholera deaths", total(data.cholera, "deaths")],
    ["Cholera affected counties", counties(data.cholera)],
    ["Dengue cases", total(data.dengue, "cases")],
    ["Dengue deaths", total(data.dengue, "deaths")],
    ["Dengue affected counties", counties(data.dengue)],
  ]);

  section("Surveillance and nutrition", [
    ["IDSR completeness", value(data.idsr, "completeness_pct")],
    ["IDSR timeliness", value(data.idsr, "timeliness_pct")],
    ["Community signals", value(data.idsr, "cebs_community_signals")],
    ["Population in IPC Phase 3+", value(data.nutrition, "phase3_above")],
    ["Population in IPC Phase 4-5", value(data.nutrition, "phase4_5")],
  ]);

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(210, 220, 230);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    pdf.setTextColor(...MUTED);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(
      "WHO Kenya Country Office | Internal weekly health emergency summary",
      margin,
      pageHeight - 7,
    );
    pdf.text(`Page ${page} of ${pages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
  }

  const filename = `WHO_Kenya_Weekly_Health_Summary_Week_${report.week_number}.pdf`;
  pdf.save(filename);

  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) {
    void supabase.from("audit_log" as never).insert({
      user_id: userData.user.id,
      action: "download_pdf",
      table_name: "weekly_report",
      report_id: reportId,
      metadata: { filename, template: "weekly_summary_v1" },
    } as never);
  }
}
