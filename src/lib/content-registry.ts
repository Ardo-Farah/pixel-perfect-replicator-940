// Content registry: declares which pages, sections, and fields admins can edit.
// Used by both the admin editor UI and the server-side validation.

export type FieldKind = "text" | "longtext" | "url" | "number" | "markdown";

export type FieldDef = {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
};

export type SectionDef = {
  key: string;
  label: string;
  fields: FieldDef[];
};

export type PageDef = {
  key: string;
  label: string;
  sections: SectionDef[];
};

const headerFields: FieldDef[] = [
  { key: "title", label: "Page title", kind: "text", placeholder: "e.g. Mpox Surveillance" },
  { key: "subtitle", label: "Subtitle", kind: "text", placeholder: "e.g. Updates" },
];

const standardSection = (key: string, label: string, withKpi = false): SectionDef => ({
  key,
  label,
  fields: [
    { key: "heading", label: "Heading", kind: "text" },
    { key: "description", label: "Short description", kind: "longtext" },
    { key: "link_label", label: "Link label", kind: "text", placeholder: "e.g. Source" },
    { key: "link_url", label: "Link URL", kind: "url", placeholder: "https://..." },
    { key: "more_info_md", label: "More information (narrative)", kind: "markdown" },
    ...(withKpi
      ? ([{ key: "kpi_value", label: "KPI override (number)", kind: "number" }] as FieldDef[])
      : []),
  ],
});

export const REGISTRY: PageDef[] = [
  {
    key: "overview",
    label: "Overview",
    sections: [
      { key: "header", label: "Page header", fields: headerFields },
      standardSection("summary", "Summary"),
      standardSection("response_notes", "Response notes & updates"),
    ],
  },
  {
    key: "mpox",
    label: "Mpox",
    sections: [
      { key: "header", label: "Page header", fields: headerFields },
      standardSection("summary", "Page intro"),
      standardSection("epi_curve", "Epi curve"),
      standardSection("distribution", "Distribution"),
      standardSection("demographics", "Demographics"),
      standardSection("deaths", "Deaths"),
      standardSection("response_notes", "Response notes & updates"),
    ],
  },
  {
    key: "measles",
    label: "Measles",
    sections: [
      { key: "header", label: "Page header", fields: headerFields },
      standardSection("summary", "Page intro"),
      standardSection("distribution", "Distribution"),
      standardSection("demographics", "Demographics"),
      standardSection("response_notes", "Response notes & updates"),
    ],
  },
  {
    key: "anthrax",
    label: "Anthrax",
    sections: [
      { key: "header", label: "Page header", fields: headerFields },
      standardSection("summary", "Page intro"),
      standardSection("distribution", "Distribution"),
      standardSection("response_notes", "Response notes & updates"),
    ],
  },
  {
    key: "floods",
    label: "Floods",
    sections: [
      { key: "header", label: "Page header", fields: headerFields },
      standardSection("summary", "Page intro"),
      standardSection("distribution", "Distribution"),
      standardSection("response_notes", "Response notes & updates"),
    ],
  },
  {
    key: "idsr",
    label: "IDSR",
    sections: [
      { key: "header", label: "Page header", fields: headerFields },
      standardSection("summary", "Page intro"),
      standardSection("overview", "Overview"),
      standardSection("response_notes", "Response notes & updates"),
    ],
  },
  {
    key: "nutrition",
    label: "Nutrition",
    sections: [
      { key: "header", label: "Page header", fields: headerFields },
      standardSection("summary", "Page intro"),
      standardSection("overview", "Overview"),
      standardSection("response_notes", "Response notes & updates"),
    ],
  },
];

export const PAGE_KEYS = REGISTRY.map((p) => p.key) as [string, ...string[]];

export function findPage(pageKey: string): PageDef | undefined {
  return REGISTRY.find((p) => p.key === pageKey);
}

export function findField(pageKey: string, sectionKey: string, fieldKey: string): FieldDef | undefined {
  return findPage(pageKey)?.sections.find((s) => s.key === sectionKey)?.fields.find((f) => f.key === fieldKey);
}
