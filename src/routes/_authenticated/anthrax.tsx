import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, MetricCard, NotesCard, ProgressBar, SectionCard, StatusPill } from "@/components/dashboard";

export const Route = createFileRoute("/_authenticated/anthrax")({
  head: () => ({
    meta: [
      { title: "Anthrax — WHO Kenya" },
      { name: "description", content: "Human and livestock anthrax surveillance, regional risk mapping, and One Health response updates for Kenya." },
    ],
  }),
  component: AnthraxPage,
});

const counties = [
  { county: "Narok", exposure: 12, livestock: 45, lab: "Confirmed", labVariant: "urgent" as const, vacc: 68 },
  { county: "Baringo", exposure: 4, livestock: 18, lab: "Pending", labVariant: "medium" as const, vacc: 42 },
  { county: "West Pokot", exposure: 8, livestock: 32, lab: "Confirmed", labVariant: "urgent" as const, vacc: 55 },
  { county: "Marsabit", exposure: 2, livestock: 12, lab: "Stable", labVariant: "low" as const, vacc: 89 },
  { county: "Kajiado", exposure: 5, livestock: 24, lab: "Pending", labVariant: "medium" as const, vacc: 71 },
];

function AnthraxPage() {
  return (
    <AppShell title={"Anthrax \n"} subtitle="UPDATES">
      <Card className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 text-body-md text-on-surface">
          <span className="material-symbols-outlined text-secondary">calendar_today</span>
          Week 34: 21st Aug 2026 to 27th Aug 2026
          <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-surface-container-high px-3 py-1 text-label-caps text-on-surface-variant">Kenya National View</span>
          <span className="rounded-full bg-secondary-fixed px-3 py-1 text-label-caps text-on-secondary-container">Active Outbreak: 3 Counties</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Total Cases" value="412" icon="person_alert" iconColor="text-error" valueColor="text-error" subtext="+8.4% monthly" centered />
        <MetricCard label="Total Deaths" value="14" icon="warning" iconColor="text-error" valueColor="text-error" subtext="+2 new recorded" subtextColor="text-error" centered />
        <MetricCard label="CFR (%)" value="3.4%" icon="report_problem" iconColor="text-error" valueColor="text-error" subtext="Critical Alert" subtextColor="text-error" centered />
        <MetricCard label="New Cases (7d)" value="12" icon="update" subtext="Narok Focus" centered />
        <MetricCard label="Recovered" value="391" icon="health_and_safety" subtext="95% rate" centered />
        <MetricCard label="Affected Counties" value="11" icon="map" subtext="3 Active" centered />
      </div>

      <SectionCard title="Secondary Anthrax Metrics" action={
        <div className="flex gap-2 text-on-surface-variant">
          <button className="p-1 hover:opacity-70"><span className="material-symbols-outlined">filter_list</span></button>
          <button className="p-1 hover:opacity-70"><span className="material-symbols-outlined">more_vert</span></button>
        </div>
      }>
        <table className="w-full text-left">
          <thead>
            <tr className="border-y border-outline-variant bg-surface-container-low">
              {["County", "Human Exposure", "Livestock Loss", "Lab Confirmation", "Vaccination Status"].map((h) => (
                <th key={h} className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {counties.map((c) => (
              <tr key={c.county} className="hover:bg-surface-container">
                <td className="px-6 py-4 text-body-md font-semibold text-on-surface">{c.county}</td>
                <td className="px-6 py-4 text-body-md text-on-surface">{c.exposure}</td>
                <td className="px-6 py-4 text-body-md text-on-surface">{c.livestock}</td>
                <td className="px-6 py-4"><StatusPill variant={c.labVariant}>{c.lab}</StatusPill></td>
                <td className="px-6 py-4 w-72"><ProgressBar value={c.vacc} color="bg-secondary" track="bg-surface-container-high" height={6} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <Card className="overflow-hidden">
        <div className="flex items-start justify-between p-6">
          <div>
            <p className="text-label-caps text-on-surface-variant">GEO-SPATIAL RISK</p>
            <h3 className="text-headline-sm text-primary mt-1">Geographic Anthrax Distribution</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-error" />High Alert</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary-container" />Active Surveillance</span>
            <button className="ml-2 inline-flex items-center gap-1 rounded border border-outline-variant px-2 py-1">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>layers</span>
              Layers
            </button>
          </div>
        </div>
        <div className="relative h-[460px] overflow-hidden bg-tertiary">
          <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-secondary-fixed-dim/20 via-tertiary to-tertiary-container" />
          <div className="absolute left-1/2 top-1/2 h-32 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-error/40 blur-3xl" />
          <div className="absolute left-[55%] top-[55%] h-20 w-24 rounded-full bg-error/60 blur-2xl" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface-container-lowest p-6 shadow-card max-w-sm">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary">music_note</span>
              <div>
                <h4 className="text-body-md font-semibold text-on-surface">Interactive Geographic Layer</h4>
                <p className="mt-1 text-metric-subtext text-on-surface-variant">
                  Zoom in to view local epidemiological triggers. Red zones indicate higher reported human-animal interface risk levels.
                </p>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-lg bg-primary px-3 py-1.5 text-label-caps text-on-primary">Enable Heatmap</button>
                  <button className="rounded-lg border border-outline-variant px-3 py-1.5 text-label-caps text-on-surface">District View</button>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 max-w-xs rounded-lg bg-tertiary-container/90 p-3 text-on-tertiary-container">
            <p className="text-label-caps text-inverse-on-surface">LIVE MONITORING</p>
            <p className="mt-1 text-body-md text-inverse-on-surface">
              Increased environmental triggers detected in Narok Valley. Surveillance teams mobilized to high-risk zones for localized reporting.
            </p>
          </div>
          <div className="absolute bottom-4 right-4 rounded-lg bg-primary px-4 py-2 text-on-primary">
            <p className="text-label-caps">SENTINEL SITE DATA</p>
            <p className="text-body-md font-semibold">ACTIVE FEEDS: 42/45</p>
          </div>
        </div>
      </Card>

      <NotesCard title="Response Updates & Clinical Notes" subtitle="Updated 2 hours ago by Field Team Alpha">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <NoteRow n="01" title="One Health Multi-Agency Response">
              Coordination meeting held between Ministry of Health (MoH) and Directorate of Veterinary Services (DVS) to streamline carcass disposal protocols in endemic zones.
            </NoteRow>
            <NoteRow n="02" title="Community Sensitization">
              Radio spots in local dialects (Maa) deployed to discourage consumption of carcasses and encourage reporting of sick livestock.
            </NoteRow>
          </div>
          <div className="space-y-4">
            <NoteRow n="03" title="Laboratory Logistics">
              Delivery of 500 Anthrax rapid diagnostic kits to sub-county health facilities in high-risk areas has been completed.
            </NoteRow>
            <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
              <p className="flex items-center gap-2 text-label-caps text-secondary">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
                PROMPT ACTION REQUIRED
              </p>
              <p className="mt-2 text-body-md text-on-surface">
                Urgent need for additional PPE sets (Level 2) in West Pokot to support burial teams.
              </p>
            </div>
          </div>
        </div>
      </NotesCard>
    </AppShell>
  );
}

function NoteRow({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex gap-3">
      <span className="text-label-caps font-bold text-primary">{n}.</span>
      <div>
        <p className="text-body-md font-semibold text-on-surface">{title}</p>
        <p className="mt-1 text-body-md text-on-surface-variant">{children}</p>
      </div>
    </div>
  );
}
