import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Official Profile — Measles" },
      { name: "description", content: "Official profile, jurisdiction and security settings for Measles personnel." },
    ],
  }),
  component: ProfilePage,
});

function Card({ icon, title, children, action }: { icon: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: 22 }}>{icon}</span>
          <h3 className="text-headline-sm font-semibold text-on-surface">{title}</h3>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-label-caps uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 text-body-md text-on-surface">{value}</p>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={[
        "relative h-6 w-11 rounded-full transition-colors",
        on ? "bg-secondary" : "bg-outline-variant",
      ].join(" ")}
      aria-pressed={on}
    >
      <span
        className={[
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          on ? "left-[22px]" : "left-0.5",
        ].join(" ")}
      />
    </button>
  );
}

function ProfilePage() {
  const [twoFA, setTwoFA] = useState(true);
  const [loginNotif, setLoginNotif] = useState(false);
  const [access, setAccess] = useState<"coordinator" | "admin">("coordinator");

  const counties = ["Nakuru County", "Baringo County", "Narok County", "Kericho County"];

  return (
    <AppShell title="Measles" subtitle="Official Profile">
      {/* Header banner */}
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="h-24 bg-gradient-to-r from-secondary-container to-surface-container" />
        <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-6 pt-0">
          <div className="-mt-12 flex items-end gap-5">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border-4 border-surface-container-lowest bg-primary">
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-on-primary">RC</div>
              <span className="absolute bottom-1 left-1 h-3 w-3 rounded-full border-2 border-surface-container-lowest bg-secondary" />
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-3">
                <h1 className="text-headline-md font-bold text-on-surface">Dr. Richard C.</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-0.5 text-label-caps font-semibold text-on-secondary-container">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> ACTIVE
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-body-md text-on-surface-variant">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: 18 }}>verified_user</span>
                Regional Coordinator - Rift Valley
              </p>
            </div>
          </div>
          <div className="flex gap-3 pb-1">
            <button className="rounded-lg bg-primary px-5 py-2.5 text-body-md font-semibold text-on-primary hover:opacity-90">
              Edit Profile
            </button>
            <button className="rounded-lg border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-body-md font-semibold text-on-surface hover:bg-surface-container-low">
              View Logs
            </button>
          </div>
        </div>
      </section>

      {/* Three-column */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card icon="badge" title="Personal Details">
          <Field label="Full Name" value="Richard Cheruiyot, MD" />
          <Field label="Official Email" value={<a className="text-secondary hover:underline" href="mailto:r.cheruiyot@who.int">r.cheruiyot@who.int</a>} />
          <Field label="Phone Number" value="+254 7XX XXX XXX" />
          <Field label="Primary Station" value="Regional HQ, Nakuru" />
        </Card>

        <Card icon="workspace_premium" title="Professional Profile">
          <Field label="Staff ID" value="WHO-KE-2024-0892" />
          <div className="mb-4">
            <p className="text-label-caps uppercase tracking-wider text-on-surface-variant">Access Level</p>
            <div className="mt-2 inline-flex overflow-hidden rounded-md border border-outline-variant">
              {(["coordinator", "admin"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setAccess(lvl)}
                  className={[
                    "px-3 py-1.5 text-label-caps font-semibold uppercase",
                    access === lvl
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low",
                  ].join(" ")}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
          <Field label="Department" value="Health Emergencies (WHE)" />
          <Field label="Reports To" value="Country Emergency Coordinator" />
        </Card>

        <Card icon="map" title="Regional Jurisdiction">
          <ul className="space-y-2">
            {counties.map((c) => (
              <li key={c} className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2.5">
                <span className="text-body-md text-on-surface">{c}</span>
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-outline-variant pt-4 text-center">
            <a href="#" className="text-body-md font-semibold text-secondary hover:underline">View Interactive Map</a>
          </div>
        </Card>
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            icon="history"
            title="Recent Actions"
            action={<a href="#" className="text-label-caps font-semibold text-secondary hover:underline">VIEW ALL ACTIVITY</a>}
          >
            <ol className="relative space-y-5 border-l border-outline-variant pl-6">
              {[
                { icon: "update", color: "bg-secondary-container text-on-secondary-container", title: "Updated IDSR report for Nakuru", desc: "Epidemiological surveillance data verified for Week 24.", time: "10 mins ago" },
                { icon: "task_alt", color: "bg-secondary-container text-on-secondary-container", title: "Approved EPR supply request", desc: "Emergency medical kits requisition for Baringo South approved.", time: "2 hours ago" },
                { icon: "login", color: "bg-surface-container text-on-surface-variant", title: "System Login", desc: "Session started from IP: 197.XXX.XXX.XX (Nairobi, KE).", time: "Today, 08:30 AM" },
              ].map((a) => (
                <li key={a.title} className="relative">
                  <span className={`absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full ${a.color}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{a.icon}</span>
                  </span>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-body-md font-semibold text-on-surface">{a.title}</p>
                      <p className="text-body-md text-on-surface-variant">{a.desc}</p>
                    </div>
                    <span className="shrink-0 text-label-caps text-on-surface-variant">{a.time}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <Card icon="shield" title="Security & Privacy">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-body-md font-semibold text-on-surface">Two-Factor Authentication</p>
              <p className="text-label-caps text-on-surface-variant">Extra security layer via SMS/App</p>
            </div>
            <Toggle on={twoFA} onChange={setTwoFA} />
          </div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-body-md font-semibold text-on-surface">Login Notifications</p>
              <p className="text-label-caps text-on-surface-variant">Alert me for new logins</p>
            </div>
            <Toggle on={loginNotif} onChange={setLoginNotif} />
          </div>
          <button className="mb-3 w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 text-body-md font-semibold text-on-surface hover:bg-surface-container-low">
            Change Password
          </button>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-error-container py-2.5 text-body-md font-semibold text-on-error-container hover:opacity-90">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            Sign Out of All Devices
          </button>
        </Card>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-5 text-label-caps text-on-surface-variant">
        <div>
          System Status: <span className="font-semibold text-secondary">STABLE</span>
          <span className="mx-2">•</span>
          Version 2.4.1-LTS
        </div>
        <div className="flex gap-5">
          <a href="#" className="hover:text-on-surface">Privacy Policy</a>
          <a href="#" className="hover:text-on-surface">Technical Support</a>
          <a href="#" className="hover:text-on-surface">Incident Reporting</a>
        </div>
      </footer>
    </AppShell>
  );
}
