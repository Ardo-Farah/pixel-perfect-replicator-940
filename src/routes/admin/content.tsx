import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/dashboard";
import { REGISTRY, type FieldDef, type PageDef } from "@/lib/content-registry";
import { getPageContent, upsertPageContent } from "@/lib/page-content";

export const Route = createFileRoute("/admin/content")({
  head: () => ({ meta: [{ title: "Page Content — Admin" }] }),
  component: ContentPage,
});

type Draft = Record<string, Record<string, { text?: string; number?: string }>>;

function ContentPage() {
  const [pageKey, setPageKey] = useState<string>(REGISTRY[0].key);
  const page = REGISTRY.find((p) => p.key === pageKey) as PageDef;

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-page-content", pageKey],
    queryFn: () => getPageContent(pageKey),
  });

  const [draft, setDraft] = useState<Draft>({});

  useEffect(() => {
    const next: Draft = {};
    for (const section of page.sections) {
      next[section.key] = {};
      for (const field of section.fields) {
        const cur = data?.[section.key]?.[field.key];
        // Pre-fill with the saved value if present, otherwise with the field's
        // current default (what the dashboard renders today) so the editor is
        // never blank and admins can see/edit the live text.
        const savedText = cur?.text;
        const text =
          savedText && savedText.trim().length > 0
            ? savedText
            : field.kind === "number"
              ? ""
              : field.defaultValue ?? "";
        const savedNum = cur?.number;
        const number =
          savedNum !== null && savedNum !== undefined
            ? String(savedNum)
            : field.kind === "number"
              ? field.defaultValue ?? ""
              : "";
        next[section.key][field.key] = { text, number };
      }
    }
    setDraft(next);
  }, [data, page]);

  const mutation = useMutation({
    mutationFn: async () => {
      const entries: Array<{ section_key: string; field_key: string; value_text?: string | null; value_number?: number | null }> = [];
      for (const section of page.sections) {
        for (const field of section.fields) {
          const cell = draft[section.key]?.[field.key];
          if (!cell) continue;
          if (field.kind === "number") {
            const trimmed = (cell.number ?? "").trim();
            entries.push({
              section_key: section.key,
              field_key: field.key,
              value_text: null,
              value_number: trimmed === "" ? null : Number(trimmed),
            });
          } else {
            entries.push({
              section_key: section.key,
              field_key: field.key,
              value_text: (cell.text ?? "").trim() === "" ? null : cell.text!,
              value_number: null,
            });
          }
        }
      }
      return upsertPageContent(pageKey, entries);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-page-content", pageKey] });
      qc.invalidateQueries({ queryKey: ["page-content", pageKey] });
    },
  });

  const updateField = (sectionKey: string, fieldKey: string, kind: FieldDef["kind"], value: string) => {
    setDraft((d) => ({
      ...d,
      [sectionKey]: {
        ...(d[sectionKey] ?? {}),
        [fieldKey]: kind === "number" ? { number: value } : { text: value },
      },
    }));
  };

  return (
    <AdminShell title="Page Content" subtitle="Edit titles, descriptions, links, and narratives">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="p-3 h-fit">
          <ul className="space-y-1">
            {REGISTRY.map((p) => (
              <li key={p.key}>
                <button
                  onClick={() => setPageKey(p.key)}
                  className={[
                    "w-full rounded-md px-3 py-2 text-left text-sm font-semibold",
                    p.key === pageKey
                      ? "bg-secondary-container text-on-secondary-container"
                      : "text-on-surface-variant hover:bg-surface-container-low",
                  ].join(" ")}
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-headline-sm text-primary">{page.label} content</h2>
              <p className="mt-1 text-xs text-on-surface-variant">
                Boxes are pre-filled with the text this page shows now. Edit any field and
                click Save — it updates the live dashboard for every user.
              </p>
            </div>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || isLoading}
              className="rounded-lg bg-[#009ADE] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {mutation.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>

          {mutation.isError ? (
            <Card className="p-3 text-sm text-error">{(mutation.error as Error).message}</Card>
          ) : null}
          {mutation.isSuccess ? (
            <Card className="p-3 text-sm text-green-700">Saved.</Card>
          ) : null}

          {isLoading ? (
            <Card className="p-6 text-sm text-on-surface-variant">Loading…</Card>
          ) : (
            page.sections.map((section) => (
              <Card key={section.key} className="p-5">
                <h3 className="mb-3 text-title-lg font-semibold text-primary">{section.label}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {section.fields.map((field) => {
                    const cell = draft[section.key]?.[field.key] ?? {};
                    const id = `${section.key}-${field.key}`;
                    const fullWidth =
                      field.kind === "longtext" || field.kind === "markdown";
                    return (
                      <div key={field.key} className={fullWidth ? "sm:col-span-2" : ""}>
                        <label htmlFor={id} className="mb-1 block text-xs font-semibold text-on-surface-variant">
                          {field.label}
                        </label>
                        {field.kind === "longtext" || field.kind === "markdown" ? (
                          <textarea
                            id={id}
                            value={cell.text ?? ""}
                            onChange={(e) => updateField(section.key, field.key, field.kind, e.target.value)}
                            spellCheck
                            rows={field.kind === "markdown" ? 8 : 3}
                            placeholder={field.placeholder}
                            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm"
                          />
                        ) : field.kind === "number" ? (
                          <input
                            id={id}
                            type="number"
                            inputMode="decimal"
                            value={cell.number ?? ""}
                            onChange={(e) => updateField(section.key, field.key, "number", e.target.value)}
                            placeholder={field.placeholder ?? "Leave blank for default"}
                            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm"
                          />
                        ) : (
                          <input
                            id={id}
                            type={field.kind === "url" ? "url" : "text"}
                            value={cell.text ?? ""}
                            onChange={(e) => updateField(section.key, field.key, field.kind, e.target.value)}
                            spellCheck={field.kind !== "url"}
                            placeholder={field.placeholder}
                            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm"
                          />
                        )}
                        {field.kind === "markdown" ? (
                          <p className="mt-1 text-xs text-on-surface-variant">
                            Supports markdown. Shown when users click "More information" on this section.
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}
