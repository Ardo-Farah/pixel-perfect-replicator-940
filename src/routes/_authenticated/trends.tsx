import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/dashboard";

export const Route = createFileRoute("/_authenticated/trends")({
  head: () => ({
    meta: [
      { title: "Historical Trends — WHO Kenya" },
      { name: "description", content: "Configure period, comparison, and disease focus to generate historical surveillance trend analysis." },
    ],
  }),
  component: TrendsPage,
});

function TrendsPage() {
  return (
    <AppShell title="Nutrition & Food Security" subtitle="Historical Analysis Dashboard">
      <Card className="p-6">
        <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
          <span className="material-symbols-outlined text-primary">tune</span>
          <h2 className="text-headline-sm font-bold text-primary">Trend Analysis Configuration</h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Field label="Primary Period" icon="calendar_today" value="Week 19, 2026" />
          <Field label="Comparison Period" icon="history" value="Week 18, 2026" toggle />
          <Field label="Disease Focus" icon="show_chart" value="All Diseases" />
          <div>
            <p className="text-label-caps text-on-surface-variant">View Aggregation</p>
            <div className="mt-2 inline-flex rounded-lg border border-outline-variant bg-surface-container-lowest p-1">
              <button className="rounded-md bg-surface-container-high px-4 py-2 text-label-caps text-on-surface">WEEKLY</button>
              <button className="px-4 py-2 text-label-caps text-on-surface-variant">MONTHLY</button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center border-t border-outline-variant pt-6">
          <button className="inline-flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 text-body-md font-semibold text-on-secondary shadow-card hover:opacity-90">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>insights</span>
            Generate Analysis
          </button>
        </div>
      </Card>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative flex h-56 w-56 items-center justify-center rounded-full border-2 border-dashed border-outline-variant bg-surface-container-low">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 64 }}>monitoring</span>
          <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-secondary">
            <span className="material-symbols-outlined">search</span>
          </div>
        </div>
        <h3 className="mt-8 text-headline-sm font-bold text-primary">Awaiting Parameters</h3>
        <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
          Configure your filters above to view historical trends, comparison summaries, and clinical analysis notes for the selected period.
        </p>
      </div>
    </AppShell>
  );
}

function Field({ label, icon, value, toggle }: { label: string; icon: string; value: string; toggle?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-label-caps text-on-surface-variant">{label}</p>
        {toggle ? (
          <span className="inline-flex h-5 w-9 items-center rounded-full bg-secondary p-0.5">
            <span className="ml-auto h-4 w-4 rounded-full bg-on-secondary" />
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: 18 }}>{icon}</span>
          <span className="text-body-md text-on-surface">{value}</span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>expand_more</span>
      </div>
    </div>
  );
}
