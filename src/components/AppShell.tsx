import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useRef, type ReactNode } from "react";
import whoKenyaLogo from "@/assets/who-kenya-logo.png";
import { supabase } from "@/lib/supabase";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { useUpload } from "@/context/UploadProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSelectedReport, formatReportLabel } from "@/context/SelectedReportProvider";

type NavItem = { to: string; label: string; icon: string; exact?: boolean };

const navItems: NavItem[] = [
  { to: "/", label: "Summary", icon: "dashboard", exact: true },
  { to: "/mpox", label: "Mpox", icon: "coronavirus" },
  { to: "/measles", label: "Measles", icon: "emergency" },
  { to: "/anthrax", label: "Anthrax", icon: "pest_control" },
  { to: "/floods", label: "Floods & MAM Rains", icon: "flood" },
  { to: "/idsr", label: "IDSR Overview", icon: "monitoring" },
  { to: "/nutrition", label: "Nutrition & Food Security", icon: "nutrition" },
  { to: "/trends", label: "Historical Trends", icon: "timeline" },
  { to: "/support", label: "User Support", icon: "support_agent" },
];

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const onProfile = pathname.startsWith("/profile");
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r border-outline-variant bg-surface">
      <div className="flex items-center justify-center px-6 py-7">
        <img
          src={whoKenyaLogo}
          alt="World Health Organization Kenya"
          className="h-20 w-20 object-contain"
        />
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
      </nav>

      <div className="border-t border-outline-variant p-4">
        <div
          className={[
            "flex items-center gap-2 rounded-lg transition-colors",
            onProfile ? "bg-secondary-container" : "",
          ].join(" ")}
        >
          <Link
            to="/profile"
            className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-container-low"
          >
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
  );
}

function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { status, startUpload } = useUpload();
  const uploading = status === "uploading";

  const handleSelectFile = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (file) startUpload(file);
  };

  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-outline-variant bg-surface px-8 py-4">
      <div>
        <h2 className="text-headline-sm font-bold text-primary">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-label-caps text-sky-500">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-body-md text-on-surface">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: 20 }}>
            calendar_today
          </span>
          <span>Week 19: 3rd May 2026 to 10th May 2026</span>
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>
            expand_more
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx,.pdf,.xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={handleSelectFile}
          disabled={uploading}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-body-md font-semibold text-on-primary hover:opacity-90 disabled:opacity-60"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            upload
          </span>
          Upload PPTX / PDF
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md font-semibold text-primary hover:bg-surface-container-low">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            download
          </span>
          Download Summary PDF
        </button>
      </div>
    </header>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-[260px] min-h-screen">
        <TopBar title={title} subtitle={subtitle} />
        <div className="mx-auto max-w-[1600px] space-y-10 p-8">{children}</div>
      </main>
      <ChatAssistant />
    </div>
  );
}
