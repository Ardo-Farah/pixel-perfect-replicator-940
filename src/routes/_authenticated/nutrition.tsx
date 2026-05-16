import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, NotesCard, ProgressBar } from "@/components/dashboard";

export const Route = createFileRoute("/_authenticated/nutrition")({
  head: () => ({
    meta: [
      { title: "Nutrition & Food Security — WHO Kenya" },
      { name: "description", content: "ASAL and refugee zone food security, IPC phase breakdowns, and weekly epidemiological insights for Kenya." },
    ],
  }),
  component: NutritionPage,
});

const breakdown = [
  { value: "7,582,000", label: "Food Security (Phase 1) - ASAL", footLabel: "Reliability:", footValue: "STABLE", footColor: "text-secondary", sub: "High" },
  { value: "429,000", label: "IPC Phase 3+ - Refugee Pop.", footLabel: "Focus Area: Dadaab/Kakuma", footValue: "CRITICAL", footColor: "text-error", side: "58% of pop." },
  { value: "186,000", label: "Emergency (Phase 4) - Refugee", footLabel: "Food Assistance Req.", footValue: "URGENT", footColor: "text-error" },
  { value: "243,000", label: "Crisis (Phase 3) - Refugee", footLabel: "Intervention", footValue: "ACTIVE", footColor: "text-secondary", sub: "Active" },
  { value: "220,000", label: "Stressed (Phase 2) - Refugee", footLabel: "Monitoring", footValue: "WATCH", footColor: "text-on-surface-variant", sub: "Status" },
  { value: "97,000", label: "Food Security (Phase 1) - Refugee", footLabel: "Minimal", footValue: "STABLE", footColor: "text-secondary", sub: "Vulnerability" },
];

function NutritionPage() {
  return (
    <AppShell title="Mpox" subtitle="UPDATES">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <p className="text-display-metric text-primary">3.7M</p>
            <span className="rounded-full bg-secondary-fixed px-3 py-1 text-label-caps text-on-secondary-container">21% of the population</span>
          </div>
          <p className="mt-4 text-label-caps text-on-surface-variant">People Facing High Levels of Acute Food Insecurity (IPC Phase 3 or Above) in ASAL</p>
          <div className="mt-6">
            <ProgressBar value={21} color="bg-secondary" track="bg-surface-container-high" height={8} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <p className="text-display-metric text-primary">545,000</p>
            <span className="material-symbols-outlined text-error">trending_up</span>
          </div>
          <p className="mt-4 text-label-caps text-on-surface-variant">People In Emergency (Phase 4) in ASAL</p>
          <p className="mt-4 text-label-caps font-bold text-error">SEVERE URGENCY</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <p className="text-display-metric text-primary">3,143,000</p>
            <span className="material-symbols-outlined text-secondary">change_history</span>
          </div>
          <p className="mt-4 text-label-caps text-on-surface-variant">People in Crisis (Phase 3) in ASAL</p>
          <p className="mt-4 text-label-caps font-bold text-secondary">HIGH VULNERABILITY</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <p className="text-display-metric text-primary">6,335,000</p>
            <span className="material-symbols-outlined text-on-surface-variant">bar_chart</span>
          </div>
          <p className="mt-4 text-label-caps text-on-surface-variant">People Stressed (Phase 2) in ASAL</p>
          <p className="mt-4 text-label-caps font-bold text-on-surface-variant">BORDERLINE AT-RISK</p>
        </Card>
      </div>

      <div>
        <h2 className="text-headline-sm font-bold text-primary">Detailed Demographic Breakdowns</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
          {breakdown.map((b) => (
            <Card key={b.label} className="p-6">
              <div className="flex items-start justify-between">
                <p className="text-2xl font-bold text-primary">{b.value}</p>
                {b.side ? <span className="text-label-caps text-error">{b.side}</span> : null}
              </div>
              <p className="mt-2 text-label-caps text-on-surface-variant">{b.label}</p>
              <hr className="my-4 border-outline-variant" />
              <div className="flex items-center justify-between">
                <p className="text-label-caps text-on-surface-variant">
                  {b.footLabel}
                  {b.sub ? <><br />{b.sub}</> : null}
                </p>
                <p className={`text-label-caps font-bold ${b.footColor}`}>{b.footValue}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <NotesCard title="Response Updates & Clinical Notes" subtitle="Weekly Epidemiological Insight - ASAL & Refugee Zones">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <NoteItem n="01" title="Severe Food Security Crisis">
              Kenya is experiencing a severe food security and nutrition crisis, particularly in the ASAL regions and refugee settlements. About 3.3 million people are in IPC Phase 3 or worse.
            </NoteItem>
            <NoteItem n="02" title="IPC Phase 4 (Emergency) Alert">
              Over 400,000 individuals are in Phase 4 (Emergency), needing urgent life-saving support. This represents a 52% increase from early 2025 data.
            </NoteItem>
            <NoteItem n="03" title="Refugee Settlement Vulnerability">
              In Dadaab and Kakuma, 430,000 residents (two-thirds of the population) are in Phase 3 or above, with settlements categorized as Phase 4.
            </NoteItem>
          </div>
          <div className="space-y-4">
            <NoteItem n="04" title="Compounded Drivers">
              The situation is driven by reduced humanitarian aid, limited livelihoods, and high food prices exacerbated by global supply chain disruptions.
            </NoteItem>
            <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-4">
              <p className="flex items-center gap-2 text-label-caps text-secondary">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
                PRIORITY OUTLOOK 2026
              </p>
              <p className="mt-2 italic text-body-md text-on-surface">
                The situation will remain critical without urgent scale-up of food, nutrition, and livelihood support through the remainder of 2026.
              </p>
            </div>
          </div>
        </div>
      </NotesCard>

      <div className="flex items-center justify-between border-t border-outline-variant pt-4 text-label-caps text-on-surface-variant">
        <div className="flex gap-6">
          <span>System Status: <span className="text-secondary">NOMINAL</span></span>
          <span>Data Refresh: 15m ago</span>
        </div>
        <span>© 2026 World Health Organization Kenya Office. All rights reserved.</span>
      </div>
    </AppShell>
  );
}

function NoteItem({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-label-caps font-bold text-primary">{n}.</span>
      <div>
        <p className="text-body-md font-semibold text-on-surface">{title}</p>
        <p className="mt-1 text-body-md text-on-surface-variant">{children}</p>
      </div>
    </div>
  );
}
