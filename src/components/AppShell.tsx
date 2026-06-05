import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import whoKenyaLogo from "@/assets/who-kenya-logo.png";
import { supabase } from "@/lib/supabase";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { useSelectedReport } from "@/context/SelectedReportProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { enabledDiseases } from "@/lib/diseases";

type NavItem = { to: string; label: string; icon: string; exact?: boolean };

// Disease nav items come from the single config (src/lib/diseases.ts); the
// fixed Summary / Trends / Support items bracket them.
const navItems: NavItem[] = [
  { to: "/", label: "Summary", icon: "dashboard", exact: true },
  ...enabledDiseases().map((d) => ({ to: `/${d.key}`, label: d.navLabel ?? d.label, icon: d.icon })),
  { to: "/trends", label: "Historical Trends", icon: "timeline" },
  { to: "/support", label: "User Support", icon: "support_agent" },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const onProfile = pathname.startsWith("/profile");
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={["fixed inset-0 z-40 bg-black/40 lg:hidden", open ? "block" : "hidden"].join(" ")}
      />
      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r border-outline-variant bg-surface",
          "transition-transform duration-200 ease-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-center px-6 py-7">
          <img src={whoKenyaLogo} alt="World Health Organization Kenya" className="h-20 w-20 object-contain" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as "/"}
                className={[
                  "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                  active
                    ? "border-l-4 border-secondary bg-secondary-container text-on-secondary-container font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-low",
                ].join(" ")}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-body-md">{item.label}</span>
              </Link>
            );
          })}

          {isAdmin ? (
            <Link
              to="/admin"
              className="mt-4 flex items-center gap-3 rounded-lg border border-[#009ADE]/40 bg-[#009ADE]/10 px-4 py-3 font-semibold text-[#009ADE] hover:bg-[#009ADE]/20"
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
              <span className="text-body-md">Admin Dashboard</span>
            </Link>
          ) : null}
        </nav>

        <div className="border-t border-outline-variant p-4">
          <div
            className={["flex items-center gap-2 rounded-lg transition-colors", onProfile ? "bg-secondary-container" : ""].join(" ")}
          >
            <Link to="/profile" className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-container-low">
              <div>
                <p className={["text-body-md font-semibold border-sky-500 font-sans", onProfile ? "text-on-secondary-container" : "text-on-surface"].join(" ")}>Profile</p>
                <p className="text-label-caps text-on-surface-variant">Regional Coordinator</p>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="mr-2 flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-error"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function TopBar({ title, subtitle, onOpenMenu }: { title: string; subtitle?: string; onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-40 flex w-full flex-col gap-3 border-b border-outline-variant bg-surface px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low lg:hidden"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-title-lg font-bold text-primary lg:text-headline-sm">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-label-caps text-sky-500">{subtitle}</p> : null}
        </div>
      </div>
      <div className="grid w-full min-w-0 grid-cols-[1fr_auto] items-center gap-2 sm:gap-3 lg:w-auto lg:shrink-0">
        <WeekSelector />
        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md font-semibold text-primary hover:bg-surface-container-low sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
          <span className="hidden sm:inline">Download Summary PDF</span>
        </button>
      </div>
    </header>
  );
}

function WeekSelector() {
  const { entries, selectedKey, setSelectedKey, loading } = useSelectedReport();
  const triggerLabel = (() => {
    if (loading) return "Loading documents…";
    if (entries.length === 0) return "No documents";
    const sel = entries.find((e) => e.key === selectedKey);
    return sel ? sel.label : "Select document";
  })();
  return (
    <Select
      value={selectedKey ?? undefined}
      onValueChange={(v) => setSelectedKey(v)}
      disabled={loading || entries.length === 0}
    >
      <SelectTrigger className="h-10 w-full min-w-0 max-w-full gap-2 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface sm:w-auto sm:px-4">
        <span className="material-symbols-outlined shrink-0 text-secondary" style={{ fontSize: 20 }}>description</span>
        <span className="min-w-0 truncate text-left">
          <SelectValue placeholder={triggerLabel}>{triggerLabel}</SelectValue>
        </span>
      </SelectTrigger>
      <SelectContent>
        {entries.map((e) => (
          <SelectItem key={e.key} value={e.key}>
            {e.label}
            {e.processed ? "" : " — not read yet"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="min-h-screen min-w-0 overflow-x-hidden lg:ml-[260px]">
        <TopBar title={title} subtitle={subtitle} onOpenMenu={() => setDrawerOpen(true)} />
        <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6 lg:space-y-10 lg:p-8">
          {children}
        </div>
      </main>
      <ChatAssistant />
    </div>
  );
}
