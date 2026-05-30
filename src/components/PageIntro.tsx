import { MoreInfoButton } from "@/components/MoreInfoDialog";
import { usePageContent } from "@/hooks/usePageContent";

type Props = {
  pageKey: string;
  defaultHeading: string;
  defaultDescription?: string;
};

/**
 * Renders the editable page intro (heading + description + "More info" pill)
 * for a dashboard page. Falls back to the supplied defaults when an admin
 * hasn't overridden them via /admin/content. Updates live via realtime.
 */
export function PageIntro({ pageKey, defaultHeading, defaultDescription = "" }: Props) {
  const content = usePageContent(pageKey);
  const heading = content.text("summary", "heading", defaultHeading);
  const description = content.text("summary", "description", defaultDescription);
  const hasMore = content.has("summary", "more_info_md");

  if (!heading && !description && !hasMore) return null;

  return (
    <div className="rounded-xl border border-outline-variant bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-left text-xl font-bold" style={{ color: "#009ADE" }}>
          {heading}
        </h2>
        <MoreInfoButton pageKey={pageKey} sectionKey="summary" title={heading} />
      </div>
      {description ? (
        <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-on-surface">
          {description}
        </p>
      ) : null}
    </div>
  );
}
