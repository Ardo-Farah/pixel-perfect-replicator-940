import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, MetricCard, NotesCard, ProgressBar } from "@/components/dashboard";

export const Route = createFileRoute("/_authenticated/floods")({
  head: () => ({
    meta: [
      { title: "Floods & MAM Rains — WHO Kenya" },
      { name: "description", content: "Floods and MAM Rains situation report: counties affected, displacement, search & rescue, and clinical response." },
    ],
  }),
  component: FloodsPage,
});

const regions = [
  { name: "Nairobi", areas: 37, pct: 90 },
  { name: "Eastern", areas: 28, pct: 70 },
  { name: "Rift Valley", areas: 19, pct: 50 },
  { name: "Nyanza", areas: 14, pct: 40 },
  { name: "Western", areas: 10, pct: 30 },
];

function FloodsPage() {
  return (
    <AppShell title={"Floods & MAM Rains\n"} subtitle="UPDATES">
      <Card className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 text-body-md text-on-surface">
          <span className="material-symbols-outlined text-secondary">calendar_today</span>
          Week 19: 3rd May 2026 to 10th May 2026
          <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-surface-container-high px-3 py-1 text-label-caps text-on-surface-variant">Kenya National View</span>
          <span className="rounded-full bg-secondary-fixed px-3 py-1 text-label-caps text-on-secondary-container">Active Outbreak: 27 Counties</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Counties Affected" value="27" icon="map" subtext="+2 from last week" centered />
        <MetricCard label="Deaths" value="122" icon="warning" iconColor="text-error" valueColor="text-error" subtext="+5 reported today" subtextColor="text-error" centered />
        <MetricCard label="People Affected" value="42,381" icon="groups" subtext="+1.2k since Monday" centered />
        <MetricCard label="Households Displaced" value="5,992" icon="location_on" subtext="Priority 1 status" centered />
        <MetricCard label="Missing" value="3" icon="person_search" subtext="Search & Rescue active" centered />
        <MetricCard label="Injured" value="8" icon="medical_services" subtext="Under clinical care" centered />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="flex items-start justify-between p-6">
            <div>
              <p className="text-label-caps text-on-surface-variant">GEO-SPATIAL RISK</p>
              <h3 className="text-headline-sm text-primary mt-1">Kenya County Map</h3>
              <p className="text-metric-subtext text-on-surface-variant">Floods & MAM Rains distribution by county</p>
            </div>
            <div className="flex gap-2 text-on-surface-variant">
              <button className="rounded border border-outline-variant p-1.5"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>zoom_in</span></button>
              <button className="rounded border border-outline-variant p-1.5"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>zoom_out</span></button>
            </div>
          </div>
          <div className="relative h-[460px] overflow-hidden bg-gradient-to-br from-secondary-fixed via-secondary-fixed-dim/40 to-tertiary-container">
            <div className="absolute left-[35%] top-[55%] h-32 w-32 rounded-full bg-orange-400/40 blur-3xl" />
            <div className="absolute left-[45%] top-[60%] h-20 w-20 rounded-full bg-rose-500/40 blur-2xl" />
            <div className="absolute bottom-6 left-6 max-w-xs rounded-lg bg-surface-container-lowest p-4 shadow-card">
              <p className="text-label-caps text-secondary">ACTIVE MONITORING</p>
              <p className="mt-1 text-body-md font-semibold text-on-surface">Tana River & Garissa</p>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Sustained river levels above threshold. Mobile clinics deployed to flood-affected sub-counties.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-headline-sm text-primary">County Breakdown</h3>
            <div className="flex gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined">filter_list</span>
              <span className="material-symbols-outlined">more_vert</span>
            </div>
          </div>
          <p className="mt-4 text-label-caps text-on-surface-variant">Top Affected Regions</p>
          <ul className="mt-3 space-y-4">
            {regions.map((r) => (
              <li key={r.name}>
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface font-semibold">{r.name}</span>
                  <span className="text-on-surface-variant">{r.areas} Areas</span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={r.pct} color="bg-secondary" track="bg-surface-container-high" height={6} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between text-metric-subtext text-on-surface-variant">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-secondary" />Inundated Zones</span>
            <span>Updated 2h ago</span>
          </div>
        </Card>
      </div>

      <NotesCard title="Response Updates & Clinical Notes" subtitle="Updated 2 hours ago by Humanitarian Coordination Hub">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <NoteRow n="01" title="Health Facility Status">
              85% of health facilities in affected regions remain operational. 12 facilities in Tana River reported partial damage; mobile clinics deployed to maintain service continuity.
            </NoteRow>
            <NoteRow n="02" title="Supplies & Logistics">
              Inter-agency Health Kits (IEHK) dispatched to Kisumu and Garissa coordination hubs. 250,000 Aqua-tabs distributed for water purification in displacement camps.
            </NoteRow>
          </div>
          <div>
            <NoteRow n="03" title="Epidemiological Risks">
              Elevated risk of AWD/Cholera in overcrowded transit centers; surveillance intensified. Catch-up immunization campaigns scheduled for displaced children under five.
            </NoteRow>
            <div className="mt-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
              <p className="flex items-center gap-2 text-label-caps text-secondary">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
                PROMPT ACTION REQUIRED
              </p>
              <p className="mt-2 text-body-md text-on-surface">
                Urgent requirement for additional dignity kits and sanitation supplies in Garissa and Tana River IDP camps.
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
