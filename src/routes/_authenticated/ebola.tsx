import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  DataSourceBanner,
  MetricCard,
  NotesCard,
  SectionCard,
} from "@/components/dashboard";
import { DiseaseMap } from "@/components/DiseaseMap";
import { PageIntro } from "@/components/PageIntro";
import { GradeBadge } from "@/components/GradeBadge";

export const Route = createFileRoute("/_authenticated/ebola")({
  head: () => ({
    meta: [
      { title: "Ebola (BVD) Surveillance — WHO Kenya" },
      {
        name: "description",
        content:
          "Bundibugyo Virus Disease updates from DRC and Uganda, Kenya alert investigations, preparedness and laboratory capacity.",
      },
    ],
  }),
  component: EbolaPage,
});

const ALERT_ROWS: {
  county: string;
  total: number;
  negative: number;
  positive: number;
  pending: number;
  highlight?: boolean;
}[] = [
  { county: "Uasin Gishu", total: 2, negative: 1, positive: 0, pending: 0 },
  { county: "Nairobi", total: 14, negative: 14, positive: 0, pending: 0 },
  { county: "Nyamira", total: 1, negative: 1, positive: 0, pending: 0, highlight: true },
  { county: "Trans Nzoia", total: 1, negative: 1, positive: 0, pending: 0 },
  { county: "Kiambu", total: 2, negative: 2, positive: 0, pending: 0 },
  { county: "Nyeri", total: 1, negative: 1, positive: 0, pending: 0 },
  { county: "Nakuru", total: 1, negative: 1, positive: 0, pending: 0 },
  { county: "West Pokot", total: 1, negative: 1, positive: 0, pending: 0 },
  { county: "Kisumu", total: 1, negative: 1, positive: 0, pending: 0 },
  { county: "Bungoma", total: 1, negative: 1, positive: 0, pending: 0 },
];

const RISK_TIERS: { label: string; color: string; description: string }[] = [
  {
    label: "Very High Risk",
    color: "#b91c1c",
    description:
      "Counties sharing a border with Uganda and South Sudan, or serving as international travel hubs (including Nairobi).",
  },
  {
    label: "High Risk",
    color: "#ef4444",
    description:
      "Counties with significant population movement through Points of Entry (land borders and airports).",
  },
  {
    label: "Medium Risk",
    color: "#f59e0b",
    description:
      "Counties near high-risk counties with potential spillover due to cross-county interaction.",
  },
  {
    label: "Low Risk",
    color: "#fbbf24",
    description:
      "Counties with minimal cross-border movement, limited connectivity to international travel routes and low likelihood of exposure to imported BVD cases.",
  },
];

function fmt(n: number) {
  return n.toLocaleString();
}

function EbolaPage() {
  const totals = ALERT_ROWS.reduce(
    (acc, r) => {
      acc.total += r.total;
      acc.negative += r.negative;
      acc.positive += r.positive;
      acc.pending += r.pending;
      return acc;
    },
    { total: 0, negative: 0, positive: 0, pending: 0 },
  );

  return (
    <AppShell title={"Ebola (BVD)\n"} subtitle="UPDATES">
      <PageIntro
        pageKey="ebola"
        defaultHeading="Bundibugyo Virus Disease (BVD) — DRC & Uganda Updates"
        defaultDescription="Ebola Virus Disease caused by Bundibugyo virus in the Democratic Republic of Congo and Uganda. PHEIC declared 16 May 2026."
      />
      <div className="flex items-center gap-3">
        <GradeBadge disease="ebola" />
        <span className="text-label-caps text-on-surface-variant">
          PHEIC declared 16 May 2026
        </span>
      </div>

      {/* Kenya alerts strip */}
      <SectionCard title="Kenya — Alerts Investigated to Date">
        <div className="px-4 pb-6 sm:px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <MetricCard label="Total Alerts Investigated" value="25" icon="fact_check" centered />
            <MetricCard
              label="Alerts Under Investigation"
              value="0"
              subtext="pending results"
              icon="hourglass_top"
              centered
            />
            <MetricCard
              label="Alerts Discarded"
              value="25"
              subtext="tested negative"
              icon="check_circle"
              iconColor="text-secondary"
              valueColor="text-secondary"
              centered
            />
            <MetricCard
              label="Alerts Confirmed"
              value="0"
              icon="verified"
              centered
            />
            <MetricCard
              label="Counties Reporting Alerts"
              value="10"
              icon="map"
              centered
            />
          </div>
          <p className="mt-4 text-center text-body-md text-on-surface-variant">
            All 25 alert samples investigated to date have tested negative for Ebola virus disease
            across 10 counties.{" "}
            <span className="font-semibold text-on-surface">Zero confirmed cases in Kenya.</span>
          </p>
        </div>
      </SectionCard>

      {/* DRC + Uganda outbreak cards */}
      <SectionCard title="Regional Outbreak — DRC & Uganda (as of 1 June 2026)">
        <div className="space-y-6 px-4 pb-6 sm:px-6">
          <div>
            <h4 className="mb-3 text-label-caps text-secondary">Democratic Republic of Congo</h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricCard label="Cumulative Confirmed Cases" value="321" centered />
              <MetricCard label="Active Confirmed Cases" value="238" centered />
              <MetricCard label="Recovered" value="6" centered valueColor="text-secondary" />
              <MetricCard
                label="Confirmed Deaths"
                value="48"
                centered
                valueColor="text-error"
                iconColor="text-error"
                icon="warning"
              />
              <MetricCard
                label="CFR"
                value="15.0%"
                centered
                valueColor="text-error"
              />
              <MetricCard
                label="Suspected Under Investigation"
                value="116"
                centered
              />
              <MetricCard label="HCW Infections" value="19" centered valueColor="text-error" />
              <MetricCard label="Contact Follow-up Rate" value="43%" centered />
              <MetricCard label="Health Zones Affected" value="16" centered />
              <MetricCard label="HCWs Recovered" value="—" centered />
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-label-caps text-secondary">Uganda</h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricCard label="Cumulative Confirmed Cases" value="15" centered />
              <MetricCard
                label="Confirmed Deaths"
                value="2"
                centered
                valueColor="text-error"
                iconColor="text-error"
                icon="warning"
              />
              <MetricCard label="HCW Infections" value="6" centered valueColor="text-error" />
              <MetricCard label="Contacts Listed" value="642" centered />
            </div>
          </div>
          <p className="text-body-md text-on-surface-variant">
            The outbreak is linked to the Bundibugyo strain (non-Zaire Ebola virus) for which no
            licensed vaccine or specific therapeutic exists. 19 health care worker infections
            reported in DRC; contact follow-up rate stands at 43%. Uganda reports 642 contacts
            listed as of 1 June 2026.
          </p>
        </div>
      </SectionCard>

      {/* Preparedness & readiness */}
      <SectionCard title="Kenya — Preparedness & Readiness">
        <div className="px-4 pb-6 sm:px-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard
              label="Travellers Screened at PoEs"
              value="70,000+"
              icon="airplanemode_active"
              centered
            />
            <MetricCard label="Points of Entry Screening" value="26" icon="flight_land" centered />
            <MetricCard
              label="HCWs Sensitised via ECHO"
              value="1,069"
              icon="school"
              centered
            />
            <MetricCard
              label="Surge Capacities Mapped"
              value="118"
              subtext="on standby"
              icon="health_and_safety"
              centered
            />
            <MetricCard
              label="Designated Testing Labs"
              value="4"
              subtext="NPHL, KEMRI Nairobi, KEMRI Kisumu, Mobile Lab Busia"
              icon="biotech"
              centered
            />
            <MetricCard
              label="HCWs Trained in Busia"
              value="50"
              subtext="integrated Ebola training"
              icon="medical_services"
              centered
            />
            <MetricCard
              label="Rapid Response Teams"
              value="24h"
              subtext="mobilised & on standby"
              icon="bolt"
              centered
            />
            <MetricCard
              label="Treatment Centres Identified"
              value="3"
              subtext="Alupe Hospital (Busia), Trans Nzoia, Turkana"
              icon="local_hospital"
              centered
            />
          </div>
        </div>
      </SectionCard>

      <DataSourceBanner
        pageKey="ebola"
        defaultLabel="Data source: Ministry of Health Kenya"
        defaultUrl="https://www.health.go.ke/"
      />

      <div
        className="flex flex-col gap-3 rounded-lg px-5 py-3 text-white sm:flex-row sm:items-center sm:justify-between"
        style={{ backgroundColor: "#5b21b6" }}
      >
        <p className="text-body-md">
          More information: WHO Disease Outbreak News — Ebola virus disease, DRC &amp; Uganda
        </p>
        <a
          href="https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON602"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-body-md underline hover:opacity-80"
        >
          View WHO bulletin
        </a>
      </div>

      {/* Risk mapping */}
      <SectionCard title="Kenya Ebola BVD Risk Mapping">
        <div className="px-4 pb-6 sm:px-6">
          <DiseaseMap disease="ebola" reportId={null} />
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {RISK_TIERS.map((tier) => (
              <Card key={tier.label} className="flex items-start gap-3 p-4">
                <span
                  className="mt-1 inline-block h-4 w-4 shrink-0 rounded"
                  style={{ backgroundColor: tier.color }}
                  aria-hidden
                />
                <div>
                  <p className="text-label-caps text-on-surface">{tier.label}</p>
                  <p className="mt-1 text-body-md text-on-surface-variant">{tier.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Alert samples table */}
      <SectionCard title="Alert Samples Investigated — Breakdown by County">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-y border-outline-variant bg-surface-container-low">
                {["County", "Total Samples", "Negative", "Positive", "Pending Results"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-table-header text-on-surface-variant uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {ALERT_ROWS.map((r) => {
                const cls = r.highlight ? "text-error" : "text-on-surface";
                return (
                  <tr key={r.county} className="hover:bg-surface-container">
                    <td className={`px-6 py-4 text-body-md font-semibold ${cls}`}>{r.county}</td>
                    <td className={`px-6 py-4 text-body-md ${cls}`}>{fmt(r.total)}</td>
                    <td className={`px-6 py-4 text-body-md ${cls}`}>{fmt(r.negative)}</td>
                    <td className={`px-6 py-4 text-body-md ${cls}`}>{fmt(r.positive)}</td>
                    <td className={`px-6 py-4 text-body-md ${cls}`}>{fmt(r.pending)}</td>
                  </tr>
                );
              })}
              <tr className="bg-surface-container-low font-bold">
                <td className="px-6 py-4 text-body-md text-on-surface">Total</td>
                <td className="px-6 py-4 text-body-md text-on-surface">{fmt(totals.total)}</td>
                <td className="px-6 py-4 text-body-md text-on-surface">{fmt(totals.negative)}</td>
                <td className="px-6 py-4 text-body-md text-on-surface">{fmt(totals.positive)}</td>
                <td className="px-6 py-4 text-body-md text-on-surface">{fmt(totals.pending)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Response Notes */}
      <NotesCard title="Response Notes & Updates" subtitle="Kenya preparedness and readiness actions">
        <div className="space-y-5 text-body-md text-on-surface">
          <div>
            <p className="text-label-caps text-secondary">Coordination</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-on-surface-variant">
              <li>KNPHI working with UN agencies, NGOs and partners on EVD response.</li>
              <li>NPHEOC activated to tier-1 alert to support risk monitoring.</li>
              <li>MoH advisory issued to the general public to raise public awareness.</li>
              <li>Emergency preparedness and readiness working group constituted, led by KNPHI.</li>
              <li>National operational readiness assessment completed; critical gaps identified.</li>
              <li>IMT activated at national and sub-national level.</li>
              <li>Preparedness and Readiness Plan refined; pending leadership endorsement.</li>
              <li>Weekly coordination meetings between national, county, and partners.</li>
            </ul>
          </div>
          <div>
            <p className="text-label-caps text-secondary">Surveillance & Data Management</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-on-surface-variant">
              <li>Enhanced surveillance in health facilities and communities, including rapid detection, reporting, and isolation protocols.</li>
              <li>Distributed surveillance case definitions and community lay case definitions to sub-national level.</li>
              <li>Over 70,000 travellers screened for EVD across 26 points of entry, strengthening early detection and prevention.</li>
              <li>Risk mapping of high-risk counties done.</li>
              <li>1,069 national and county healthcare workers sensitised on EVD via the ECHO virtual platform.</li>
              <li>118 surge capacities mapped and on standby.</li>
              <li>Rapid response teams mobilised and maintained on 24-hour standby for rapid deployment.</li>
              <li>High-risk counties supported and guided to identify, assess, and operationalise isolation facilities and holding areas.</li>
            </ul>
          </div>
          <div>
            <p className="text-label-caps text-secondary">Case Management & IPC</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-on-surface-variant">
              <li>Identification and assessment of isolation and treatment centres across very high-risk counties is underway.</li>
              <li>Alupe Hospital (Busia) earmarked for renovation and operationalisation; Trans Nzoia and Turkana sites planned.</li>
              <li>50 health/non-health workers from Busia trained on integrated Ebola training — case management, IPC, SDB, surveillance, contact tracing.</li>
              <li>Trans Nzoia and Turkana counties conducting integrated Ebola training and simulation exercises.</li>
            </ul>
          </div>
          <div>
            <p className="text-label-caps text-secondary">Laboratory</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-on-surface-variant">
              <li>4 designated Ebola testing labs: National Public Health Laboratory, KEMRI Nairobi, KEMRI Kisumu, and Mobile Lab Busia.</li>
              <li>Testing kits available for approximately the first 200 suspected cases.</li>
              <li>25 alert samples investigated; all tested negative for Ebola across 10 counties.</li>
            </ul>
          </div>
        </div>
      </NotesCard>
    </AppShell>
  );
}
