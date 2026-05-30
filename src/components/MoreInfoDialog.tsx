import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { usePageContent } from "@/hooks/usePageContent";

type Props = {
  pageKey: string;
  sectionKey: string;
  title?: string;
};

export function MoreInfoButton({ pageKey, sectionKey, title = "More information" }: Props) {
  const [open, setOpen] = useState(false);
  const content = usePageContent(pageKey);
  const md = content.text(sectionKey, "more_info_md", "");

  if (!md) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-primary hover:bg-surface-container"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
        More information
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="text-headline-sm text-primary">{title}</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-low"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="prose prose-sm max-w-none text-on-surface [&_a]:text-primary [&_h1]:text-headline-sm [&_h2]:text-title-lg [&_h3]:text-title-md">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{md}</ReactMarkdown>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
