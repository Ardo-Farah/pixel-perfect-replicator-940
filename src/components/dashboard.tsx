import type { ReactNode } from "react";
import { MoreInfoButton } from "@/components/MoreInfoDialog";
import { usePageContent } from "@/hooks/usePageContent";

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

/** KPI / metric card matching screens (icon top-right, big metric, optional subtext). */
export function MetricCard({
  label,
  value,
  icon,
  iconColor = "text-secondary",
  subtext,
  subtextColor = "text-on-surface-variant",
  valueColor = "text-primary",
  centered = false,
}: {
  label: string;
  value: ReactNode;
  icon?: string;
  iconColor?: string;
  subtext?: ReactNode;
  subtextColor?: string;
  valueColor?: string;
  centered?: boolean;
}) {
  if (centered) {
    return (
      <Card className="flex min-w-0 flex-col items-center px-4 py-5 text-center sm:px-6 sm:py-6">
        {icon ? (
          <span className={`material-symbols-outlined mb-3 ${iconColor}`} style={{ fontSize: 32 }}>
            {icon}
          </span>
        ) : null}
        <p className={`max-w-full break-words text-display-metric ${valueColor}`}>{value}</p>
        <p className="text-label-caps mt-2 max-w-full break-words text-secondary">{label}</p>
        {subtext ? <p className={`mt-1 text-metric-subtext ${subtextColor}`}>{subtext}</p> : null}
      </Card>
    );
  }
  return (
    <Card className="relative flex min-h-32 min-w-0 flex-col justify-between p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <p className="text-label-caps min-w-0 break-words text-on-surface-variant">{label}</p>
        {icon ? (
          <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
        ) : null}
      </div>
      <p className={`max-w-full break-words text-display-metric ${valueColor}`}>{value}</p>
      {subtext ? (
        <p className={`absolute bottom-4 left-6 text-metric-subtext ${subtextColor}`}>{subtext}</p>
      ) : null}
    </Card>
  );
}

export function StatusPill({
  variant,
  children,
}: {
  variant:
    | "target-met"
    | "stable"
    | "below-target"
    | "urgent"
    | "medium"
    | "low"
    | "live"
    | "ok"
    | "neutral"
    | "info"
    | "danger"
    | "success";
  children: ReactNode;
}) {
  const map: Record<string, string> = {
    "target-met": "bg-secondary-fixed text-on-secondary-container",
    stable: "bg-surface-container-high text-on-surface-variant",
    "below-target": "bg-error-container text-on-error-container",
    urgent: "bg-error-container text-on-error-container",
    medium: "bg-surface-container-high text-on-surface-variant",
    low: "bg-surface-container-high text-on-surface-variant",
    live: "bg-tertiary text-on-tertiary",
    ok: "bg-secondary-fixed text-on-secondary-container",
    neutral: "bg-surface-container-high text-on-surface-variant",
    info: "bg-secondary-fixed text-on-secondary-container",
    danger: "bg-error-container text-on-error-container",
    success: "bg-green-100 text-green-800",
  };
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${map[variant]}`}
    >
      {children}
    </span>
  );
}

export function SectionCard({
  title,
  action,
  moreInfo,
  children,
  className = "",
}: {
  title: ReactNode;
  action?: ReactNode;
  moreInfo?: { pageKey: string; sectionKey: string };
  children: ReactNode;
  className?: string;
}) {
  const showMoreInfo = !!moreInfo;
  // When the section is registered (moreInfo present) and the title is plain
  // text, let admins override the heading via /admin/content (section "heading").
  const content = usePageContent(moreInfo?.pageKey ?? "");
  const heading =
    moreInfo && typeof title === "string"
      ? content.text(moreInfo.sectionKey, "heading", title)
      : title;
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <h3 className="min-w-0 break-words text-headline-sm text-primary">{heading}</h3>
        {(action || showMoreInfo) ? (
          <div className="shrink-0 flex items-center gap-2">
            {showMoreInfo ? <MoreInfoButton pageKey={moreInfo!.pageKey} sectionKey={moreInfo!.sectionKey} /> : null}
            {action}
          </div>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

// Renders labeled narrative notes extracted from the selected document. Empty
// fields are skipped; if none are present an empty-state line is shown. This is
// what makes the notes sections reflect the uploaded document as source of truth.
export function DocumentNotes({
  items,
  empty = "No notes were recorded in the selected document.",
}: {
  items: { label: string; body: string | null | undefined }[];
  empty?: string;
}) {
  const present = items.filter((i) => i.body && String(i.body).trim());
  if (present.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{empty}</p>;
  }
  return (
    <div className="space-y-4">
      {present.map((i) => (
        <div key={i.label}>
          <p className="text-label-caps text-secondary">{i.label}</p>
          <p className="mt-1 whitespace-pre-line text-body-md text-on-surface">{i.body}</p>
        </div>
      ))}
    </div>
  );
}

export function NotesCard({
  title,
  icon = "info",
  subtitle,
  children,
  className = "",
}: {
  title: string;
  icon?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-outline-variant p-4 sm:p-6 ${className}`}
      style={{ background: "var(--notes-bg)" }}
    >
      <div className="mb-4 flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {icon}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="break-words text-headline-sm text-primary">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-metric-subtext text-on-surface-variant">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

// The blue "Data source: …" banner shown on each disease page. Text and link
// are editable in /admin/content under the page's "Data source banner" section
// (fields: label, link_url, link_label). The link is hidden when no URL is set.
export function DataSourceBanner({
  pageKey,
  defaultLabel,
  defaultUrl = "",
}: {
  pageKey: string;
  defaultLabel: string;
  defaultUrl?: string;
}) {
  const content = usePageContent(pageKey);
  const label = content.text("source", "label", defaultLabel);
  const url = content.text("source", "link_url", defaultUrl);
  const linkLabel = content.text("source", "link_label", defaultUrl ? "Click here for link" : "");
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-lg px-5 py-3 text-white"
      style={{ backgroundColor: "#00205c" }}
    >
      <p className="text-body-md">{label}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-body-md underline hover:opacity-80"
        >
          {linkLabel || "Click here for link"}
        </a>
      ) : null}
    </div>
  );
}

export function MapPlaceholder({
  title = "Interactive Geographic Layer",
  body,
  height = 360,
}: {
  title?: string;
  body?: string;
  height?: number;
}) {
  return (
    <div
      className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-outline-variant bg-gradient-to-br from-secondary-fixed/40 via-surface-container-low to-tertiary-container/10"
      style={{ height: `min(${height}px, 70vh)` }}
    >
      <div className="mx-3 max-w-[calc(100%-1.5rem)] rounded-lg bg-surface-container-lowest/90 px-4 py-5 text-center shadow-card backdrop-blur sm:px-6">
        <span className="material-symbols-outlined text-secondary" style={{ fontSize: 32 }}>
          map
        </span>
        <p className="text-headline-sm mt-2 text-primary">{title}</p>
        {body ? (
          <p className="mt-1 max-w-xs text-metric-subtext text-on-surface-variant">{body}</p>
        ) : null}
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  color = "bg-secondary",
  track = "bg-surface-container-high",
  height = 6,
}: {
  value: number; // 0-100
  color?: string;
  track?: string;
  height?: number;
}) {
  return (
    <div className={`w-full overflow-hidden rounded-full ${track}`} style={{ height }}>
      <div className={`${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%`, height }} />
    </div>
  );
}
