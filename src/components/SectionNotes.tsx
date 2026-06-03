import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { usePageContent } from "@/hooks/usePageContent";
import { findField } from "@/lib/content-registry";

/**
 * Renders the editable commentary shown beside/below a chart in a section.
 * Reads page_content[sectionKey].notes_md, falling back to the registry default
 * for that field (the text the chart shipped with). Admins edit it in
 * Admin → Page Content under the page's section ("Notes shown beside the chart").
 */
export function SectionNotes({
  pageKey,
  sectionKey,
  className = "",
}: {
  pageKey: string;
  sectionKey: string;
  className?: string;
}) {
  const content = usePageContent(pageKey);
  const fallback = findField(pageKey, sectionKey, "notes_md")?.defaultValue ?? "";
  const md = content.text(sectionKey, "notes_md", fallback);
  if (!md.trim()) return null;
  return (
    <div
      className={`prose prose-sm mt-4 max-w-none text-body-md text-on-surface [&_strong]:font-semibold [&_li]:my-1 [&_ul]:list-disc [&_ul]:pl-5 ${className}`}
    >
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{md}</ReactMarkdown>
    </div>
  );
}
