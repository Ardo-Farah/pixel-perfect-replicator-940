// Content registry: declares which pages, sections, and fields admins can edit
// in /admin/content, AND the current default text each dashboard shows.
//
// `defaultValue` is the single source of truth for the text a page renders when
// an admin hasn't overridden it. The admin editor pre-fills each box with this
// default (so the page is never "empty"), and the dashboard components read the
// same field via usePageContent(...).text(section, field, default). Saving in
// the editor persists the value and it reflects on every user's dashboard.

export type FieldKind = "text" | "longtext" | "url" | "number" | "markdown";

export type FieldDef = {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  defaultValue?: string;
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

// --- Section builders -------------------------------------------------------

const header = (title: string, subtitle = "UPDATES"): SectionDef => ({
  key: "header",
  label: "Page header (top banner)",
  fields: [
    { key: "title", label: "Page title", kind: "text", defaultValue: title },
    { key: "subtitle", label: "Subtitle", kind: "text", defaultValue: subtitle },
  ],
});

const intro = (heading: string, description: string): SectionDef => ({
  key: "summary",
  label: "Page intro",
  fields: [
    { key: "heading", label: "Heading", kind: "text", defaultValue: heading },
    { key: "description", label: "Short description", kind: "longtext", defaultValue: description },
    { key: "more_info_md", label: '"More info" narrative', kind: "markdown" },
  ],
});

const source = (label: string, url = ""): SectionDef => ({
  key: "source",
  label: "Data source banner",
  fields: [
    { key: "label", label: "Banner text", kind: "text", defaultValue: label },
    { key: "link_url", label: "Link URL (leave blank to hide link)", kind: "url", defaultValue: url, placeholder: "https://..." },
    { key: "link_label", label: "Link text", kind: "text", defaultValue: url ? "Click here for link" : "" },
  ],
});

const section = (
  key: string,
  label: string,
  headingDefault: string,
  notesDefault?: string,
): SectionDef => ({
  key,
  label,
  fields: [
    { key: "heading", label: "Heading", kind: "text", defaultValue: headingDefault },
    { key: "more_info_md", label: '"More info" narrative', kind: "markdown" },
    ...(notesDefault !== undefined
      ? ([{ key: "notes_md", label: "Notes shown beside the chart (markdown)", kind: "markdown", defaultValue: notesDefault }] as FieldDef[])
      : []),
  ],
});

const notes = (label = "Response notes & updates"): SectionDef => ({
  key: "response_notes",
  label,
  fields: [
    { key: "more_info_md", label: "Notes (markdown — shown on the page)", kind: "markdown" },
  ],
});

const MOH = "Data source: Ministry of Health Kenya";
const MOH_URL = "https://www.health.go.ke/";

// --- Registry ---------------------------------------------------------------

export const REGISTRY: PageDef[] = [
  {
    key: "overview",
    label: "Overview",
    sections: [
      header("Kenya's Weekly Health Emergencies\n"),
      intro(
        "Overview of the Current Health Emergencies in Kenya 2026",
        "Kenya is managing multiple concurrent public health emergencies including one protracted Grade 2 emergency (Mpox, Clade 1b), measles outbreaks in two counties, widespread flooding from the long rains, acute food insecurity and malnutrition crisis in nine arid and semi-arid land (ASAL) counties, a Grade 3 Bundibugyo Virus Disease (BVD) outbreak in the Democratic Republic of Congo and Uganda posing cross-border risk to Kenya, a cholera outbreak in Garissa County, and a newly reported dengue fever upsurge in Garissa County.",
      ),
      notes(),
    ],
  },
  {
    key: "mpox",
    label: "Mpox",
    sections: [
      header("Mpox\n"),
      intro("Mpox Surveillance", "Weekly Mpox surveillance metrics, lab capacity, and clinical response notes."),
      source(MOH, MOH_URL),
      section(
        "epi_curve",
        "Epi curve",
        "Epi curve of the confirmed Mpox cases, Kenya, 2024–2026",
        "Four counties have consistently reported cases with **Mombasa leading 40%**, Nairobi **17%**, Busia **10%** and Makueni **7.4%**.",
      ),
      section(
        "distribution",
        "County distribution",
        "Distribution of Mpox cases by county, Kenya, 2024–2026 (n=1,123)",
        "- **38/47 (81%)** have been affected.\n- Four counties have consistently reported cases with Mombasa leading **40%**, Nairobi **17%**, Busia **10%** and Makueni **7.4%**.",
      ),
      section(
        "demographics",
        "Demographics",
        "Demographic characteristics of Mpox cases, Kenya, 2024–2026",
        "- Truck drivers, sex workers and business workers working in the stop-over markets of truck drivers constitute **26% (129 cases)** of all cases.\n- Those aged **15–44 yrs** accounted for **69% (456 cases)** of the reported cases.\n- Reported males **32%**, females **30%**, and **400 cases (38%)** are missing data.\n- Transmission dynamics: **predominantly sexual transmission**.",
      ),
      section(
        "deaths_hiv",
        "Deaths by HIV status",
        "Mpox deaths HIV status",
        "- Among deaths with confirmed HIV status, the majority were **female (62%)**.\n- Overall, most deaths occurred among individuals who were **HIV positive (68%)**.\n- The case that tested HIV negative had a co-morbidity — **Diabetes Mellitus**.",
      ),
      section(
        "deaths_analysis",
        "Death analysis",
        "Mpox death analysis",
        "- Total deaths — **19**.\n- Females accounted for the majority of Mpox deaths, with **10 cases (53%)**.\n- Among females, the highest number of deaths occurred in the **25–34 age group**.\n- Among males, deaths were highest in the **35–44 age group**.\n- Overall, most deaths occurred among adults aged **25–54 years**.",
      ),
      notes(),
    ],
  },
  {
    key: "measles",
    label: "Measles",
    sections: [
      header("Measles\n"),
      intro("Measles Surveillance", "Weekly measles case counts, county distribution, and outbreak response."),
      source(MOH, MOH_URL),
      section(
        "epi_curve",
        "Epi curve",
        "Epi curve of the confirmed measles cases, Kenya, 2024–2026",
        "Outbreak onset in **late Nov 2025** with a sharp index spike, followed by sustained transmission peaking **Jan–Feb 2026** before tapering after early Mar 2026.",
      ),
      section("distribution", "Distribution table", "Table 1: Distribution of measles cases by county 2026 — Kenya"),
      section(
        "demographics",
        "Epidemiological analysis",
        "Epidemiological analysis of the reported cases",
        "- Most of the cases, **218 (60.5%)** are aged ≥10 years.\n- More than half are males, **223 (62%)**.",
      ),
      notes("Response activities and gaps"),
    ],
  },
  {
    key: "anthrax",
    label: "Anthrax",
    sections: [
      header("Anthrax \n"),
      intro("Anthrax Surveillance", "Human and animal anthrax cases by county."),
      source(MOH, MOH_URL),
      section("distribution", "Secondary metrics", "Secondary Anthrax Metrics"),
      notes(),
    ],
  },
  {
    key: "idsr",
    label: "IDSR",
    sections: [
      header("IDSR Overview\n"),
      intro("IDSR Overview", "Integrated Disease Surveillance and Response — timeliness, completeness, and alerts."),
      source("Data source: Weekly IDSR reports, KHIS"),
      notes(),
    ],
  },
  {
    key: "nutrition",
    label: "Nutrition",
    sections: [
      header("Nutrition & Food Security\n"),
      intro("Nutrition & Food Security", "IPC classification and ASAL population at risk."),
      source("Data Source: Kenya IPC (Integrated Food Security Phase Classifications)"),
      notes(),
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
