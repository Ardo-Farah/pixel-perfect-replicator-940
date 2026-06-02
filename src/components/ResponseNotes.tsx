import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { usePageContent } from "@/hooks/usePageContent";

// Renders the editable "Response notes" for a page from the Page Content store
// (Admin → Page Content → Response notes & updates). The AI seeds this at
// read-in and admins can tweak it. Falls back to `fallback` (the per-report
// extracted notes) when nothing has been written for the page yet.
export function ResponseNotes({ pageKey, fallback }: { pageKey: string; fallback?: ReactNode }) {
  const content = usePageContent(pageKey);
  const md = content.text("response_notes", "more_info_md", "");

  if (md.trim()) {
    return (
      <div className="space-y-2 text-body-md text-on-surface [&_a]:text-secondary [&_a]:underline [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:leading-relaxed [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{md}</ReactMarkdown>
      </div>
    );
  }
  if (content.loading) {
    return <p className="text-body-md text-on-surface-variant">Loading notes…</p>;
  }
  return (
    <>
      {fallback ?? (
        <p className="text-body-md text-on-surface-variant">No notes recorded for the selected report yet.</p>
      )}
    </>
  );
}
