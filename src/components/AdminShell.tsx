import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import whoKenyaLogo from "@/assets/who-kenya-logo.png";
import { supabase } from "@/lib/supabase";
import { useUpload } from "@/context/UploadProvider";

type NavItem = { to: string; label: string; icon: string; exact?: boolean };

const adminNav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: "dashboard", exact: true },
  { to: "/admin/reports", label: "Reports", icon: "description" },
  { to: "/admin/users", label: "Users", icon: "group" },
  { to: "/admin/documents", label: "Documents", icon: "folder" },
  { to: "/admin/logs", label: "Logs & Analytics", icon: "analytics" },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={[
          "fixed inset-0 z-40 bg-black/40 lg:hidden",
          open ? "block" : "hidden",
        ].join(" ")}
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
          {adminNav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
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
        </nav>

        <div className="border-t border-outline-variant p-4 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-on-surface-variant hover:bg-surface-container-low text-body-md"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            Back to user dashboard
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-on-surface-variant hover:bg-surface-container-low hover:text-error text-body-md"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

function TopBar({ title, subtitle, onOpenMenu, showUpload }: {
  title: string; subtitle?: string; onOpenMenu: () => void; showUpload?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { status, startUpload, registerFilePicker } = useUpload();
  const uploading = status === "uploading";

  useEffect(() => {
    registerFilePicker(() => fileInputRef.current?.click());
  }, [registerFilePicker]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (f) startUpload(f);
  };

  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between gap-3 border-b border-outline-variant bg-surface px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low lg:hidden"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-title-lg font-bold text-primary lg:text-headline-sm">{title}</h2>
            <span className="rounded-full bg-[#009ADE] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Admin</span>
          </div>
          {subtitle ? <p className="mt-0.5 text-label-caps text-sky-500">{subtitle}</p> : null}
        </div>
      </div>
      {showUpload ? (
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".pptx,.pdf,.xlsx,.xls" className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-[#009ADE] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload</span>
            <span className="hidden sm:inline">Upload Report</span>
          </button>
        </div>
      ) : null}
    </header>
  );
}

export function AdminShell({ children, title, subtitle, showUpload }: {
  children: ReactNode; title: string; subtitle?: string; showUpload?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="min-h-screen min-w-0 overflow-x-hidden lg:ml-[260px]">
        <TopBar title={title} subtitle={subtitle} onOpenMenu={() => setDrawerOpen(true)} showUpload={showUpload} />
        <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
