import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/dashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useWeeklyReports } from "@/hooks/useReport";
import { supabase } from "@/lib/supabase";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/trends")({
  head: () => ({
    meta: [
      { title: "Historical Trends — WHO Kenya" },
      { name: "description", content: "Compare weekly surveillance data across periods and diseases." },
    ],
  }),
  component: TrendsPage,
});

type Disease = "all" | "mpox" | "measles" | "anthrax" | "idsr" | "nutrition";
type Aggregation = "weekly" | "monthly";

const DISEASES: { value: Disease; label: string }[] = [
  { value: "all", label: "All Diseases" },
  { value: "mpox", label: "Mpox" },
  { value: "measles", label: "Measles" },
  { value: "anthrax", label: "Anthrax" },
  { value: "idsr", label: "IDSR" },
  { value: "nutrition", label: "Nutrition" },
];

// disease -> { table, metrics: [{key,label}] }
const DISEASE_CONFIG: Record<Exclude<Disease, "all">, { table: string; isArray?: boolean; metrics: { key: string; label: string }[] }> = {
  mpox:      { table: "mpox_data",      metrics: [{ key: "cumulative_cases", label: "Cumulative Cases" }, { key: "new_cases_this_week", label: "New Cases (Week)" }, { key: "deaths", label: "Deaths" }, { key: "counties_affected", label: "Counties Affected" }] },
  measles:   { table: "measles_data",   metrics: [{ key: "total_cases", label: "Total Cases" }, { key: "confirmed", label: "Confirmed" }, { key: "suspected", label: "Suspected" }, { key: "counties_affected", label: "Counties Affected" }] },
  anthrax:   { table: "anthrax_data",   isArray: true, metrics: [{ key: "human_cases", label: "Human Cases" }, { key: "human_deaths", label: "Human Deaths" }, { key: "animal_deaths", label: "Animal Deaths" }] },
  idsr:      { table: "idsr_data",      metrics: [{ key: "completeness_pct", label: "Completeness %" }, { key: "timeliness_pct", label: "Timeliness %" }, { key: "cebs_community_signals", label: "CEBS Signals" }] },
  nutrition: { table: "nutrition_data", metrics: [{ key: "phase3_above", label: "Phase 3+" }, { key: "phase4_5", label: "Phase 4-5" }] },
};

type MetricRow = { key: string; label: string; primary: number | null; comparison: number | null };

async function fetchDiseaseMetrics(disease: Exclude<Disease, "all">, reportId: string): Promise<Record<string, number>> {
  const cfg = DISEASE_CONFIG[disease];
  const { data, error } = await supabase
    .from(cfg.table as never)
    .select("*")
    .eq("report_id", reportId);
  if (error || !data) return {};
  const rows = data as Record<string, unknown>[];
  if (cfg.isArray) {
    // Aggregate (sum numeric metrics across rows)
    const out: Record<string, number> = {};
    for (const m of cfg.metrics) {
      out[m.key] = rows.reduce((s, r) => s + (Number(r[m.key]) || 0), 0);
    }
    return out;
  }
  const row = rows[0] ?? {};
  const out: Record<string, number> = {};
  for (const m of cfg.metrics) out[m.key] = Number(row[m.key]) || 0;
  return out;
}

function TrendsPage() {
  const { reports, loading: reportsLoading } = useWeeklyReports();
  const [primaryId, setPrimaryId] = useState<string>("");
  const [comparisonId, setComparisonId] = useState<string>("");
  const [comparisonEnabled, setComparisonEnabled] = useState(true);
  const [disease, setDisease] = useState<Disease>("all");
  const [aggregation, setAggregation] = useState<Aggregation>("weekly");

  // Default to latest two reports once loaded
  useEffect(() => {
    if (reports.length && !primaryId) {
      setPrimaryId(reports[0].id);
      if (reports[1]) setComparisonId(reports[1].id);
    }
  }, [reports, primaryId]);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    primaryLabel: string;
    comparisonLabel: string | null;
    perDisease: { disease: Exclude<Disease, "all">; label: string; metrics: MetricRow[] }[];
  } | null>(null);

  const labelFor = (id: string) => {
    const r = reports.find((x) => x.id === id);
    if (!r) return "—";
    const d = r.reporting_date ? new Date(r.reporting_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
    return `Week ${r.week_number}${d ? ` · ${d}` : ""}`;
  };

  async function onGenerate() {
    if (!primaryId) return;
    setAnalyzing(true);
    try {
      const targets: Exclude<Disease, "all">[] = disease === "all"
        ? (Object.keys(DISEASE_CONFIG) as Exclude<Disease, "all">[])
        : [disease];

      const perDisease = await Promise.all(targets.map(async (d) => {
        const primary = await fetchDiseaseMetrics(d, primaryId);
        const comparison = (comparisonEnabled && comparisonId) ? await fetchDiseaseMetrics(d, comparisonId) : null;
        const metrics: MetricRow[] = DISEASE_CONFIG[d].metrics.map((m) => ({
          key: m.key,
          label: m.label,
          primary: primary[m.key] ?? null,
          comparison: comparison ? (comparison[m.key] ?? null) : null,
        }));
        return { disease: d, label: DISEASES.find((x) => x.value === d)!.label, metrics };
      }));

      setResult({
        primaryLabel: labelFor(primaryId),
        comparisonLabel: comparisonEnabled && comparisonId ? labelFor(comparisonId) : null,
        perDisease,
      });
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <AppShell title={"Historical Analysis\n"} subtitle="Updates">
      <Card className="p-6">
        <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
          <span className="material-symbols-outlined text-primary">tune</span>
          <h2 className="text-headline-sm font-bold text-primary">Trend Analysis Configuration</h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
          <FieldShell label="Primary Period" icon="calendar_today">
            <PeriodSelect reports={reports} loading={reportsLoading} value={primaryId} onChange={setPrimaryId} />
          </FieldShell>

          <FieldShell
            label="Comparison Period"
            icon="history"
            right={
              <Switch checked={comparisonEnabled} onCheckedChange={setComparisonEnabled} />
            }
          >
            <PeriodSelect reports={reports} loading={reportsLoading} value={comparisonId} onChange={setComparisonId} disabled={!comparisonEnabled} />
          </FieldShell>

          <FieldShell label="Disease Focus" icon="show_chart">
            <Select value={disease} onValueChange={(v) => setDisease(v as Disease)}>
              <SelectTrigger className="border-outline-variant bg-surface-container-lowest">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISEASES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>

          <div>
            <p className="text-label-caps text-on-surface-variant">View Aggregation</p>
            <div className="mt-2 inline-flex rounded-lg border border-outline-variant bg-surface-container-lowest p-1">
              <button
                onClick={() => setAggregation("weekly")}
                className={`rounded-md px-4 py-2 text-label-caps ${aggregation === "weekly" ? "bg-surface-container-high text-on-surface" : "text-on-surface-variant"}`}
              >WEEKLY</button>
              <button
                onClick={() => setAggregation("monthly")}
                className={`rounded-md px-4 py-2 text-label-caps ${aggregation === "monthly" ? "bg-surface-container-high text-on-surface" : "text-on-surface-variant"}`}
              >MONTHLY</button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center border-t border-outline-variant pt-6">
          <button
            onClick={onGenerate}
            disabled={!primaryId || analyzing}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 text-body-md font-semibold text-on-secondary shadow-card hover:opacity-90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>insights</span>
            {analyzing ? "Analyzing…" : "Generate Analysis"}
          </button>
        </div>
      </Card>

      {!result ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative flex h-56 w-56 items-center justify-center rounded-full border-2 border-dashed border-outline-variant bg-surface-container-low">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 64 }}>monitoring</span>
            <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-secondary">
              <span className="material-symbols-outlined">search</span>
            </div>
          </div>
          <h3 className="mt-8 text-headline-sm font-bold text-primary">Awaiting Parameters</h3>
          <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
            Configure your filters above and click Generate Analysis to compare periods across diseases.
          </p>
        </div>
      ) : (
        <ResultView result={result} aggregation={aggregation} />
      )}
    </AppShell>
  );
}

function PeriodSelect({ reports, loading, value, onChange, disabled }: {
  reports: { id: string; week_number: number; reporting_date: string | null }[];
  loading: boolean;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger className="border-outline-variant bg-surface-container-lowest">
        <SelectValue placeholder={loading ? "Loading…" : "Select week"} />
      </SelectTrigger>
      <SelectContent>
        {reports.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            Week {r.week_number}{r.reporting_date ? `, ${new Date(r.reporting_date).getFullYear()}` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FieldShell({ label, icon, right, children }: { label: string; icon: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-label-caps text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: 16 }}>{icon}</span>
          {label}
        </p>
        {right}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

type ResultData = {
  primaryLabel: string;
  comparisonLabel: string | null;
  perDisease: { disease: Exclude<Disease, "all">; label: string; metrics: MetricRow[] }[];
};

function ResultView({ result, aggregation }: { result: ResultData; aggregation: Aggregation }) {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-body-md text-on-surface">
            <span className="font-semibold text-primary">{result.primaryLabel}</span>
            {result.comparisonLabel && (
              <>
                <span className="mx-2 text-on-surface-variant">vs</span>
                <span className="font-semibold text-primary">{result.comparisonLabel}</span>
              </>
            )}
          </div>
          <span className="rounded-full bg-surface-container-high px-3 py-1 text-label-caps text-on-surface-variant">
            {aggregation === "weekly" ? "Weekly View" : "Monthly View"}
          </span>
        </div>
      </Card>

      {result.perDisease.map((d) => (
        <DiseaseSection key={d.disease} label={d.label} metrics={d.metrics} hasComparison={!!result.comparisonLabel} />
      ))}
    </div>
  );
}

function DiseaseSection({ label, metrics, hasComparison }: { label: string; metrics: MetricRow[]; hasComparison: boolean }) {
  const allZero = metrics.every((m) => !m.primary && !m.comparison);
  const chartData = useMemo(() => metrics.map((m) => ({
    name: m.label,
    Primary: m.primary ?? 0,
    Comparison: m.comparison ?? 0,
  })), [metrics]);

  return (
    <Card className="p-6">
      <h3 className="text-headline-sm font-bold text-primary">{label}</h3>
      {allZero ? (
        <p className="mt-4 text-body-md text-on-surface-variant">No data for the selected period.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {metrics.map((m) => {
              const delta = hasComparison && m.primary !== null && m.comparison !== null && m.comparison !== 0
                ? ((m.primary - m.comparison) / m.comparison) * 100
                : null;
              return (
                <div key={m.key} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
                  <p className="text-label-caps text-on-surface-variant">{m.label}</p>
                  <p className="mt-1 text-headline-sm font-bold text-primary">{m.primary ?? "—"}</p>
                  {hasComparison && (
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      vs {m.comparison ?? "—"}
                      {delta !== null && (
                        <span className={`ml-2 font-semibold ${delta > 0 ? "text-error" : delta < 0 ? "text-secondary" : "text-on-surface-variant"}`}>
                          {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {Math.abs(delta).toFixed(1)}%
                        </span>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--outline-variant))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Primary" fill="hsl(var(--primary))" />
                {hasComparison && <Bar dataKey="Comparison" fill="hsl(var(--secondary))" />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
}
