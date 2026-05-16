import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "User Support — WHO Kenya" },
      { name: "description", content: "Help center and support resources for WHO Kenya health surveillance users." },
    ],
  }),
  component: () => (
    <AppShell title="Mpox" subtitle="User Support">
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-10 text-center shadow-card">
        <span className="material-symbols-outlined text-secondary" style={{ fontSize: 48 }}>support_agent</span>
        <h2 className="mt-3 text-headline-sm font-bold text-primary">Need help?</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Open the Summary dashboard to view system health, recent tickets, and support protocols.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-md font-semibold text-on-primary"
        >
          Go to Summary
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
        </Link>
      </div>
    </AppShell>
  ),
});
