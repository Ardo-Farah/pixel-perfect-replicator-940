// Edge Function: process-upload
// Runtime: Deno (Supabase Edge Functions)
//
// Paste the contents of this file into the `process-upload` function in the
// Supabase dashboard for project xewepnpqhwxsqiqhbfyr and deploy.
//
// Required secrets (Project Settings -> Edge Functions -> Secrets):
//   GROQ_API_KEY                -- from https://console.groq.com
//   ANTHROPIC_API_KEY           -- from https://console.anthropic.com
//   ANTHROPIC_MODEL             -- optional, defaults to claude-sonnet-4-20250514
//   SUPABASE_URL                -- auto-provided
//   SUPABASE_SERVICE_ROLE_KEY   -- auto-provided
//   SUPABASE_ANON_KEY           -- auto-provided (used for JWT verification)
//
// Request:  POST { file_path: string, file_name: string }  + Authorization: Bearer <user JWT>
// Response: { report_id, week_number, reporting_date, tables_written: string[] }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import JSZip from "https://esm.sh/jszip@3.10.1";
// pdf-parse cannot run in the Supabase Edge (Deno) runtime — it bundles a
// legacy pdf.js that requires a web worker ("No PDFJS.workerSrc specified").
// unpdf is the maintained, serverless/Deno-first pdf.js wrapper and gives the
// same "all text from every page" result with no worker.
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_VALIDATE_MODEL = "llama-3.1-8b-instant";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const REPORT_UPLOAD_EXTENSIONS = new Set(["pptx", "pdf", "xlsx", "xls"]);

function anthropicModel() {
  const configured = (Deno.env.get("ANTHROPIC_MODEL") || DEFAULT_ANTHROPIC_MODEL).trim();
  if (configured === "claude-sonnet-4-20250514") return DEFAULT_ANTHROPIC_MODEL;
  return configured;
}

const SCHEMA_DOC = `
You will receive raw text extracted from a weekly health surveillance report
(PPTX or Excel) from Kenya's Ministry of Health / WHO. Extract every value you
can find and return STRICT JSON matching the shape below.

Rules:
- Output ONE JSON object only. No prose, no markdown.
- Use null for any field you cannot confidently find. Do NOT invent values.
- Numbers must be numbers (not strings). Percentages as numeric (e.g. 87.5 not "87.5%").
- READ THE ENTIRE REPORT to the very end. Reports are split into "### Slide N"
  or "### Sheet:" blocks — process EVERY block; key figures and the county tables
  for a disease are frequently on later slides/sheets. Do not stop early.
- IMPORTANT: figures are often stated INSIDE prose sentences, bullets, or slide
  text (e.g. "1,376 contacts listed and 1,141 completed follow-up", "10.2 million
  travellers screened", "39 counties affected"). Pull every such figure into its
  matching numeric field — do NOT leave a numeric field null when its value
  appears anywhere in the report. Strip thousands separators ("1,376" -> 1376) and
  expand units ("10.2 million" -> 10200000, "3.3M" -> 3300000). Still never invent
  a figure that is not stated.
- County case tables usually appear as row lists ("Nairobi 12, Mombasa 8 …") or
  as a table of County / Sub-county / Cases / Deaths. Emit ONE array row per
  county/sub-county you find, with its exact cases and deaths.
- report_summary.grade_1 / grade_2 / grade_3 = the COUNT of emergencies currently
  classified at WHO grade 1, 2 and 3 respectively (read the emergencies / grading
  overview; e.g. a Grade 2 Mpox emergency counts as grade_2 = 1). new_events and
  outbreaks are the totals stated for the week.
- Dates as ISO YYYY-MM-DD.
- Arrays may be empty [] if no rows are present.
- Narrative / notes fields (response_activities, challenges, clinical_notes,
  epidemiological_summary, laboratory_status, strategic_updates, genomic_subclade,
  response_updates, prompt_action, gaps_next_steps,
  ipc_notes, key_drivers, contributing_factors): WRITE these as concise, professional
  1–3 sentence summaries that synthesize what THIS report shows for that disease
  (case counts and trends, hardest-hit counties, deaths/CFR, response actions, gaps).
  Prefer the report's own wording where it provides a relevant paragraph, but you MAY
  author the summary yourself when the source has no explicit narrative. Do NOT
  fabricate specific numbers, counties, or dates that the data does not support —
  summarize only what the figures show. Use null only when there is genuinely nothing
  to say for that disease. For the per-county array tables (ebola_data, cholera_data,
  dengue_data), put the same response_updates, prompt_action, response_activities and
  gaps_next_steps on every row.

Shape:
{
  "weekly_reports":      { "week_number": number, "reporting_date": "YYYY-MM-DD", "published": false },
  "report_summary":      { "new_events": number|null, "outbreaks": number|null, "grade_1": number|null, "grade_2": number|null, "grade_3": number|null },
  "mpox_data":           { "cumulative_cases": number|null, "new_cases_this_week": number|null, "deaths": number|null, "cfr": number|null, "counties_affected": number|null, "recovered": number|null, "active_facility": number|null, "active_home": number|null, "contacts_listed": number|null, "contacts_completed": number|null, "contacts_follow_up": number|null, "vaccinations": number|null, "traveller_screenings": number|null, "hiv_co_infection_deaths": number|null, "response_activities": string|null, "challenges": string|null, "genomic_subclade": string|null },
  "mpox_counties":       [ { "county_name": string, "cases_2026": number|null, "is_hotspot": boolean|null } ],
  "mpox_demographics":   [ { "age_group": string|null, "sex": string|null, "occupation": string|null, "case_count": number|null } ],
  "measles_data":        { "total_cases": number|null, "confirmed": number|null, "suspected": number|null, "counties_affected": number|null, "response_activities": string|null, "challenges": string|null, "clinical_notes": string|null, "epidemiological_summary": string|null, "laboratory_status": string|null, "strategic_updates": string|null },
  "measles_counties":    [ { "county_name": string, "sub_county": string|null, "case_count": number|null } ],
  "ebola_data":          [ { "county": string, "sub_county": string|null, "cases": number|null, "deaths": number|null, "cfr": number|null, "response_updates": string|null, "prompt_action": string|null, "response_activities": string|null, "gaps_next_steps": string|null } ],
  "cholera_data":        [ { "county": string, "sub_county": string|null, "cases": number|null, "deaths": number|null, "cfr": number|null, "response_updates": string|null, "prompt_action": string|null, "response_activities": string|null, "gaps_next_steps": string|null } ],
  "dengue_data":         [ { "county": string, "sub_county": string|null, "cases": number|null, "deaths": number|null, "cfr": number|null, "response_updates": string|null, "prompt_action": string|null, "response_activities": string|null, "gaps_next_steps": string|null } ],
  "idsr_data":           { "completeness_pct": number|null, "timeliness_pct": number|null, "cebs_community_signals": number|null },
  "idsr_counties":       [ { "county_name": string, "completeness_pct": number|null, "timeliness_pct": number|null, "below_threshold": boolean|null } ],
  "nutrition_data":      { "phase3_above": number|null, "phase4_5": number|null, "ipc_notes": string|null, "key_drivers": string|null, "contributing_factors": string|null },
  "nutrition_counties":  [ { "county_name": string, "ipc_phase": number|null, "projected_phase": number|null, "population_affected": number|null } ],
  "weather_data":        [ { "region": string, "max_temp_c": number|null, "min_temp_c": number|null, "rainfall_onset": string|null } ]
}

Note: "ebola_data" covers Ebola / Bundibugyo Virus Disease (BVD) / any viral
haemorrhagic fever cases reported for Kenya.
`.trim();

// MIRRORS src/lib/diseases.ts — the lean per-county disease tables. Keep aligned
// when adding/removing a disease section.
const LEAN_DISEASE_TABLES = ["ebola_data", "cholera_data", "dengue_data"] as const;

// Single-row tables (object) vs array tables. weekly_reports handled separately.
const SINGLE_ROW_TABLES = [
  "report_summary",
  "mpox_data",
  "measles_data",
  "idsr_data",
  "nutrition_data",
] as const;

const ARRAY_TABLES = [
  "mpox_counties",
  "mpox_demographics",
  "measles_counties",
  ...LEAN_DISEASE_TABLES,
  "idsr_counties",
  "nutrition_counties",
  "weather_data",
] as const;

function isoWeek(d: Date): number {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const diff = d.getTime() - startOfWeek1.getTime();
  return 1 + Math.floor(diff / (7 * 864e5));
}

// Drop null/undefined keys so NOT NULL columns fall back to their DB DEFAULT.
function stripNulls(o: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== null && v !== undefined),
  );
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extensionOf(name: string): string {
  const safe = name.trim().split(/[\\/]/).pop() ?? "";
  const dot = safe.lastIndexOf(".");
  return dot >= 0 ? safe.slice(dot + 1).toLowerCase() : "";
}

async function extractXlsxText(bytes: Uint8Array): Promise<string> {
  const wb = XLSX.read(bytes, { type: "array" });
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const tsv = XLSX.utils.sheet_to_csv(sheet, { FS: "\t" });
    parts.push(`### Sheet: ${name}\n${tsv}`);
  }
  return parts.join("\n\n");
}

// --- PPTX structure helpers -------------------------------------------------
// PowerPoint stores TABLES (county case lists) and CHARTS (epi curves, pie/bar
// demographics) as structured XML. The old extractor stripped all tags, which
// flattened tables into unaligned word-soup and dropped chart numbers entirely
// (charts live in separate ppt/charts/chartN.xml parts). These helpers recover
// both losslessly so the model reads exact figures, not a guess.

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");
}

// All <a:t> text runs (drawingml text) within a fragment, in document order.
function aTexts(xml: string): string[] {
  return [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => decodeXml(m[1]).trim()).filter(Boolean);
}

// Chart data points keyed by their <c:pt idx="…">, so categories and values can
// be paired by original index even when some points are blank or omitted — a gap
// in one series must not shift the other. Fragments without explicit idx (e.g. a
// literal series-name <c:tx>) fall back to sequential numbering.
function chartPoints(block: string): Map<number, string> {
  const out = new Map<number, string>();
  let any = false;
  for (const m of block.matchAll(/<c:pt\b[^>]*\bidx="(\d+)"[^>]*>[\s\S]*?<c:v>([\s\S]*?)<\/c:v>[\s\S]*?<\/c:pt>/g)) {
    any = true;
    const v = decodeXml(m[2]).trim();
    if (v !== "") out.set(Number(m[1]), v);
  }
  if (!any) {
    let i = 0;
    for (const m of block.matchAll(/<c:v>([\s\S]*?)<\/c:v>/g)) {
      const v = decodeXml(m[1]).trim();
      if (v !== "") out.set(i, v);
      i++;
    }
  }
  return out;
}

// The single text value of a fragment (chart/series title), if any.
function chartFirst(block: string): string {
  const pts = chartPoints(block);
  if (pts.size === 0) return "";
  return pts.get(Math.min(...pts.keys())) ?? "";
}

// Parse <a:tbl> tables in a slide into markdown rows; return them plus the
// slide XML with table blocks removed (so their text isn't double-counted).
function extractTables(slideXml: string): { tables: string[]; rest: string } {
  const tables: string[] = [];
  for (const tbl of slideXml.matchAll(/<a:tbl>([\s\S]*?)<\/a:tbl>/g)) {
    const rows: string[] = [];
    for (const tr of tbl[1].matchAll(/<a:tr\b[^>]*>([\s\S]*?)<\/a:tr>/g)) {
      const cells = [...tr[1].matchAll(/<a:tc\b[^>]*>([\s\S]*?)<\/a:tc>/g)].map((tc) =>
        aTexts(tc[1]).join(" ").replace(/\s+/g, " ").trim(),
      );
      if (cells.length) rows.push(`| ${cells.join(" | ")} |`);
    }
    if (rows.length) {
      // markdown separator after the header row for clarity
      if (rows.length > 1) {
        const cols = (rows[0].match(/\|/g)?.length ?? 1) - 1;
        rows.splice(1, 0, `|${" --- |".repeat(Math.max(cols, 1))}`);
      }
      tables.push(rows.join("\n"));
    }
  }
  const rest = slideXml.replace(/<a:tbl>[\s\S]*?<\/a:tbl>/g, " ");
  return { tables, rest };
}

// Turn one chart part (ppt/charts/chartN.xml) into labeled "cat=val" lines.
function parseChartXml(xml: string): string | null {
  const titleBlock = xml.match(/<c:title>([\s\S]*?)<\/c:title>/)?.[1] ?? "";
  const title = aTexts(titleBlock).join(" ").trim();
  const lines: string[] = [];
  for (const ser of xml.matchAll(/<c:ser>([\s\S]*?)<\/c:ser>/g)) {
    const body = ser[1];
    const serName = chartFirst(body.match(/<c:tx>([\s\S]*?)<\/c:tx>/)?.[1] ?? "");
    const cats = chartPoints(body.match(/<c:cat>([\s\S]*?)<\/c:cat>/)?.[1] ?? "");
    const vals = chartPoints(body.match(/<c:val>([\s\S]*?)<\/c:val>/)?.[1] ?? "");
    if (vals.size === 0) continue;
    // Pair by original index so a blank/missing category never shifts the values.
    const pairs = [...vals.keys()]
      .sort((a, b) => a - b)
      .map((i) => (cats.get(i) ? `${cats.get(i)}=${vals.get(i)}` : (vals.get(i) ?? "")));
    lines.push(`- ${serName ? serName + ": " : ""}${pairs.join(", ")}`);
  }
  if (lines.length === 0) return null;
  return `${title ? `Chart "${title}"` : "Chart"}\n${lines.join("\n")}`;
}

// Resolve an OOXML relationship Target (e.g. "../charts/chart1.xml") against a
// base directory (e.g. "ppt/slides") to a zip path ("ppt/charts/chart1.xml").
function resolveRelTarget(baseDir: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const stack: string[] = [];
  for (const seg of `${baseDir}/${target}`.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") stack.pop();
    else stack.push(seg);
  }
  return stack.join("/");
}

function sortedNumberedFiles(paths: string[], pattern: RegExp): string[] {
  return paths.sort((a, b) => {
    const na = parseInt(a.match(pattern)?.[1] ?? "0", 10);
    const nb = parseInt(b.match(pattern)?.[1] ?? "0", 10);
    return na - nb;
  });
}

async function extractPptxNotesBySlide(zip: JSZip, slideNumbers: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const n of slideNumbers) {
    const relsFile = zip.files[`ppt/slides/_rels/slide${n}.xml.rels`];
    if (!relsFile) continue;
    const rels = await relsFile.async("string");
    for (const rel of rels.matchAll(/<Relationship\b[^>]*?>/g)) {
      const el = rel[0];
      const type = el.match(/Type="([^"]+)"/)?.[1] ?? "";
      const target = el.match(/Target="([^"]+)"/)?.[1] ?? "";
      if (!/\/notesSlide$/.test(type) || !target) continue;
      const notesFile = zip.files[resolveRelTarget("ppt/slides", target)];
      if (!notesFile) continue;
      const notesXml = await notesFile.async("string");
      const notes = aTexts(notesXml).join(" ").replace(/\s+/g, " ").trim();
      if (notes) out.set(n, notes);
    }
  }
  return out;
}

async function extractEmbeddedWorkbookText(zip: JSZip, debug: Record<string, unknown>): Promise<string[]> {
  const workbookFiles = Object.keys(zip.files)
    .filter((p) => /^ppt\/embeddings\/.+\.(xlsx|xlsm|xls)$/i.test(p))
    .sort();
  debug.pptx_embedded_workbooks = workbookFiles.length;

  const parts: string[] = [];
  for (const path of workbookFiles) {
    try {
      const bytes = await zip.files[path].async("uint8array");
      const text = await extractXlsxText(bytes);
      if (text.trim()) {
        parts.push(`### Embedded Workbook: ${path}\n${text}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      parts.push(`### Embedded Workbook: ${path}\n[Could not parse workbook: ${msg}]`);
    }
  }
  return parts;
}

async function extractPptxText(
  bytes: Uint8Array,
  debug: Record<string, unknown>,
): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const slideFiles = sortedNumberedFiles(
    Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p)),
    /slide(\d+)\.xml/,
  );
  const slideNumbers = slideFiles.map((path) => path.match(/slide(\d+)/)![1]);
  const notesBySlide = await extractPptxNotesBySlide(zip, slideNumbers);
  debug.pptx_slides = slideFiles.length;
  debug.pptx_notes_slides = notesBySlide.size;
  console.log(`[pptx] slides found: ${slideFiles.length}`);

  let tableCount = 0;
  let chartCount = 0;
  const parts: string[] = [];

  for (const path of slideFiles) {
    const n = path.match(/slide(\d+)/)![1];
    const xml = await zip.files[path].async("string");

    // Tables → markdown; prose from what's left.
    const { tables, rest } = extractTables(xml);
    tableCount += tables.length;
    const prose = aTexts(rest).join(" ").replace(/\s+/g, " ").trim();

    // Charts referenced from this slide's rels → labeled values.
    const chartBlocks: string[] = [];
    const relsFile = zip.files[`ppt/slides/_rels/slide${n}.xml.rels`];
    if (relsFile) {
      const rels = await relsFile.async("string");
      // Match the opening tag for both <Relationship .../> and <Relationship ...>
      // forms — attributes live in the opening tag either way.
      for (const rel of rels.matchAll(/<Relationship\b[^>]*?>/g)) {
        const el = rel[0];
        const type = el.match(/Type="([^"]+)"/)?.[1] ?? "";
        const target = el.match(/Target="([^"]+)"/)?.[1] ?? "";
        if (!/\/chart$/.test(type) || !target) continue;
        const chartFile = zip.files[resolveRelTarget("ppt/slides", target)];
        if (!chartFile) continue;
        const parsed = parseChartXml(await chartFile.async("string"));
        if (parsed) {
          chartBlocks.push(parsed);
          chartCount++;
        }
      }
    }

    let block = `### Slide ${n}`;
    if (prose) block += `\n${prose}`;
    if (tables.length) block += `\n#### Tables\n${tables.join("\n\n")}`;
    if (chartBlocks.length) block += `\n#### Charts\n${chartBlocks.join("\n")}`;
    const notes = notesBySlide.get(n);
    if (notes) block += `\n#### Speaker Notes\n${notes}`;
    parts.push(block);
  }

  const embeddedWorkbookParts = await extractEmbeddedWorkbookText(zip, debug);
  parts.push(...embeddedWorkbookParts);

  debug.pptx_tables = tableCount;
  debug.pptx_charts = chartCount;
  console.log(`[pptx] tables=${tableCount} charts=${chartCount} notes=${notesBySlide.size} workbooks=${embeddedWorkbookParts.length}`);
  return parts.join("\n\n");
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  // mergePages: true concatenates the text of every page into one string.
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return (typeof text === "string" ? text : text.join("\n")).trim();
}

// Fast, cheap yes/no gate: is this plausibly a WHO Kenya / Kenya MOH weekly
// health surveillance report? Fails OPEN — any validator error/timeout returns
// { valid: true } so a real upload is never blocked by validator trouble.
async function validateDocument(
  text: string,
  debug: Record<string, unknown>,
): Promise<{ valid: boolean }> {
  console.log("[validate] starting document validation");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000); // own 15s budget
  try {
    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) throw new Error("Missing GROQ_API_KEY secret");

    const sample = text.slice(0, 6000);
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_VALIDATE_MODEL,
        temperature: 0,
        max_tokens: 50,
        messages: [
          {
            role: "system",
            content:
              "You classify documents. Answer with exactly one word: YES or NO.",
          },
          {
            role: "user",
            content:
              "Does the following text look like a WHO Kenya or Kenya Ministry of Health WEEKLY HEALTH SURVEILLANCE report? Look for: disease names (Mpox, Measles, Ebola, Cholera, Dengue, IDSR), Kenyan county names, health metrics / case counts, and WHO or Ministry of Health references. Answer YES if it plausibly is such a report; answer NO only if it clearly is not (e.g. an invoice, resume, contract, random document). Answer with only YES or NO.\n\n--- TEXT START ---\n" +
              sample +
              "\n--- TEXT END ---",
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq ${res.status}: ${errText.slice(0, 300)}`);
    }
    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    debug.validate_raw = content;
    console.log(`[validate] model answer: ${JSON.stringify(content)}`);

    const ans = content.trim().toUpperCase();
    // Reject ONLY on a clear NO; anything ambiguous is treated as valid.
    const rejected = /^NO\b/.test(ans) || (ans.includes("NO") && !ans.includes("YES"));
    const valid = !rejected;
    console.log(`[validate] result: ${valid ? "VALID" : "REJECTED"}`);
    return { valid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[validate] validator unavailable — failing open: ${msg}`);
    return { valid: true };
  } finally {
    clearTimeout(timer);
  }
}

function parseModelJson(content: string, provider: string): Record<string, unknown> {
  const cleaned = content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // Fall through to the clearer provider-specific error below.
      }
    }
    throw new Error(`${provider} did not return valid JSON`);
  }
}

async function callClaude(
  text: string,
  debug: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY secret");
  const model = anthropicModel();

  // Keep requests comfortably under edge/API limits while preserving most reports.
  const MAX_CHARS = 200_000;
  const payloadText = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;
  if (text.length > MAX_CHARS) debug.truncated_chars = text.length - MAX_CHARS;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 16000,
      system:
        "You are a meticulous disease-surveillance data extractor and analyst. Return ONLY one valid JSON object matching the user's schema. Use null for unknown numeric/date/county values and NEVER invent those. For the narrative/notes fields, however, you must WRITE concise professional summaries that synthesize what the report's data shows for each disease — author them yourself when the source lacks an explicit paragraph, without fabricating specific figures.",
      messages: [
        {
          role: "user",
          content: `${SCHEMA_DOC}\n\n--- REPORT TEXT START ---\n${payloadText}\n--- REPORT TEXT END ---`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude ${res.status}: ${errText.slice(0, 500)}`);
  }
  const data = await res.json();
  const content = Array.isArray(data?.content)
    ? data.content
        .filter((part: { type?: string; text?: string }) => part?.type === "text" && typeof part.text === "string")
        .map((part: { text: string }) => part.text)
        .join("\n")
    : "";
  if (!content) throw new Error("Claude returned empty content");
  debug.claude_model = model;
  debug.claude_raw = content;
  console.log(`[claude] model=${model}`);
  console.log(`[claude] raw response:\n${content}`);
  return parseModelJson(content, "Claude");
}

// Generates the short commentary shown beside each chart/pie (the `notes_md`
// fields rendered by SectionNotes). Grounded strictly in the already-extracted
// numbers so it phrases, never invents. Fail-open: any error returns {} and the
// page falls back to its registry-default text.
const CHART_NOTE_SCHEMA = `Return ONLY one JSON object with EXACTLY this shape (each value a short GitHub-flavored markdown string, or "" when the data does not support it):
{
  "mpox": { "epi_curve": "", "distribution": "", "demographics": "", "deaths_hiv": "", "deaths_analysis": "" },
  "measles": { "epi_curve": "", "demographics": "" }
}
Rules:
- Each note is 1–3 short markdown lines summarizing what that chart shows. Use "- " bullets for multiple points and **bold** the key figures.
- mpox.epi_curve / mpox.distribution: county spread — how many of 47 counties are affected and the leading counties with their share.
- mpox.demographics: age groups, sex split, and notable occupations/transmission from mpox_demographics.
- mpox.deaths_hiv: deaths broken down by HIV status/sex (only if present).
- mpox.deaths_analysis: total deaths and their age/sex distribution.
- measles.epi_curve: outbreak onset/peak/trend timing. measles.demographics: age and sex split.
- Use ONLY numbers, counties, ages, percentages, and dates present in the DATA below. NEVER invent figures. If a section's data is missing, return "" for it.`;

async function generateChartNotes(
  extracted: Record<string, unknown>,
  debug: Record<string, unknown>,
): Promise<Record<string, Record<string, string>>> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return {};
  const model = anthropicModel();
  const slice = {
    mpox_data: extracted.mpox_data ?? null,
    mpox_counties: extracted.mpox_counties ?? null,
    mpox_demographics: extracted.mpox_demographics ?? null,
    measles_data: extracted.measles_data ?? null,
    measles_counties: extracted.measles_counties ?? null,
  };
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system:
        "You write concise, accurate chart captions for a disease-surveillance dashboard. You ONLY rephrase numbers given to you and never invent figures, counties, ages, or dates. Return ONLY the requested JSON object.",
      messages: [{ role: "user", content: `${CHART_NOTE_SCHEMA}\n\n--- DATA (JSON) ---\n${JSON.stringify(slice)}` }],
    }),
  });
  if (!res.ok) throw new Error(`Claude chart-notes ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const content = Array.isArray(data?.content)
    ? data.content.filter((p: { type?: string; text?: string }) => p?.type === "text" && typeof p.text === "string").map((p: { text: string }) => p.text).join("\n")
    : "";
  if (!content) return {};
  debug.chart_notes_raw = content;
  return parseModelJson(content, "Claude") as Record<string, Record<string, string>>;
}

// Second-pass audit: re-read the source against the first-pass JSON and correct
// any single-row numeric field that disagrees with the report, and flag county
// tables that look missed. Numbers only, so output stays small. Fail-open: any
// error returns no corrections and the first-pass result stands.
const VERIFY_TABLES = ["report_summary", "mpox_data", "measles_data", "idsr_data", "nutrition_data"];

async function verifyExtraction(
  text: string,
  extracted: Record<string, unknown>,
  debug: Record<string, unknown>,
): Promise<{ corrections: Record<string, Record<string, number>>; notes: string[] }> {
  const empty = { corrections: {}, notes: [] as string[] };
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return empty;
  const model = anthropicModel();

  const slice: Record<string, unknown> = {};
  for (const t of VERIFY_TABLES) slice[t] = extracted[t] ?? null;
  // include county tables so the auditor can judge completeness
  for (const t of ["mpox_counties", "measles_counties", "ebola_data", "cholera_data", "dengue_data"]) {
    const v = extracted[t];
    slice[t] = Array.isArray(v) ? { rows: v.length } : null;
  }

  const AUDIT = `You are auditing a data extraction. Compare the EXTRACTED JSON against the SOURCE REPORT TEXT and return ONLY one JSON object:
{ "corrections": { "<table>": { "<numericField>": number } }, "notes": ["..."] }
Rules:
- Audit ONLY these single-row tables and their numeric fields: ${VERIFY_TABLES.join(", ")}.
- Add a field to "corrections" ONLY when the EXTRACTED value is wrong or missing AND the SOURCE clearly states a different number. Use the SOURCE's exact number (strip separators, expand units). Never invent a number absent from the SOURCE.
- In "notes" (max 6 short strings), name any per-county table (mpox_counties, measles_counties, ebola_data, cholera_data, dengue_data) that clearly has county rows in the SOURCE but is empty/too small in the EXTRACTED JSON.
- If everything matches, return { "corrections": {}, "notes": [] }.`;

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        system: "You are a meticulous data-quality auditor. Return ONLY the requested JSON object. Never invent figures.",
        messages: [{ role: "user", content: `${AUDIT}\n\n--- EXTRACTED JSON ---\n${JSON.stringify(slice)}\n\n--- SOURCE REPORT TEXT START ---\n${text.slice(0, 200_000)}\n--- SOURCE REPORT TEXT END ---` }],
      }),
    });
    if (!res.ok) throw new Error(`Claude verify ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const content = Array.isArray(data?.content)
      ? data.content.filter((p: { type?: string; text?: string }) => p?.type === "text" && typeof p.text === "string").map((p: { text: string }) => p.text).join("\n")
      : "";
    if (!content) return empty;
    const parsed = parseModelJson(content, "Claude") as { corrections?: Record<string, Record<string, number>>; notes?: string[] };
    debug.verify_raw = content;
    return { corrections: parsed.corrections ?? {}, notes: Array.isArray(parsed.notes) ? parsed.notes.slice(0, 6) : [] };
  } catch (e) {
    debug.verify_error = e instanceof Error ? e.message : String(e);
    return empty;
  }
}

// Apply audited numeric corrections in place; record each applied change.
function applyCorrections(
  extracted: Record<string, unknown>,
  corrections: Record<string, Record<string, number>>,
  warnings: string[],
): void {
  for (const [table, fields] of Object.entries(corrections)) {
    if (!VERIFY_TABLES.includes(table)) continue;
    const row = extracted[table];
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      if (Object.keys(fields).length) extracted[table] = { ...fields };
      continue;
    }
    const r = row as Record<string, unknown>;
    for (const [field, value] of Object.entries(fields)) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      const before = r[field];
      if (before !== value) {
        r[field] = value;
        warnings.push(`verify: corrected ${table}.${field} ${before ?? "null"} -> ${value}`);
      }
    }
  }
}

// Sanity-clamp impossible numbers and warn rather than silently store them.
function validateRanges(extracted: Record<string, unknown>, warnings: string[]): void {
  const clampField = (table: string, field: string, lo: number, hi: number) => {
    const row = extracted[table];
    if (!row || typeof row !== "object" || Array.isArray(row)) return;
    const r = row as Record<string, unknown>;
    const v = r[field];
    if (typeof v === "number" && (v < lo || v > hi)) {
      warnings.push(`range: ${table}.${field}=${v} outside [${lo}, ${hi}] — left as-is, please verify`);
    }
  };
  clampField("mpox_data", "cfr", 0, 100);
  clampField("mpox_data", "counties_affected", 0, 47);
  clampField("measles_data", "counties_affected", 0, 47);
  const wr = extracted.weekly_reports as Record<string, unknown> | undefined;
  if (wr && typeof wr.week_number === "number" && (wr.week_number < 1 || wr.week_number > 53)) {
    warnings.push(`range: week_number=${wr.week_number} outside [1, 53]`);
  }
}

// Headline case/death counts the model returns must actually appear in the
// source text; if not, they're likely hallucinated — drop them (set null) so an
// invented figure is never shown. Derived/counted fields (cfr, counties_affected,
// grades) are NOT in these lists — they can be legitimately computed.
const GROUND_DROP: Record<string, string[]> = {
  mpox_data: [
    "cumulative_cases", "new_cases_this_week", "deaths", "recovered",
    "active_facility", "active_home", "contacts_listed", "contacts_completed",
    "contacts_follow_up", "vaccinations", "traveller_screenings", "hiv_co_infection_deaths",
  ],
  measles_data: ["total_cases", "confirmed", "suspected"],
};
const LEAN_DROP_FIELDS = ["cases", "deaths"];

type EvidenceRow = {
  field_path: string;
  value_text: string;
  numeric_value?: number;
  source_type: "text" | "table" | "chart" | "notes" | "workbook";
  slide_number?: number;
  source_snippet: string;
  confidence: number;
};

// True if v occurs in the (pre-normalized: lowercased, spaces+commas stripped)
// source — directly, or unit-expressed ("10.2 million" for 10200000, "3.3k").
function numberInSource(v: number, hay: string): boolean {
  if (!Number.isFinite(v)) return true;
  const cands = new Set<string>([String(v), v.toLocaleString("en-US")]);
  for (const [div, units] of [[1e6, ["million", "m"]], [1e3, ["thousand", "k"]]] as [number, string[]][]) {
    if (Math.abs(v) >= div) {
      const scaled = v / div;
      for (const f of new Set([String(scaled), scaled.toFixed(1), String(Math.round(scaled))])) {
        for (const u of units) cands.add(`${f}${u}`);
      }
    }
  }
  for (const c of cands) {
    const cn = c.toLowerCase().replace(/[\s,]/g, "");
    if (cn && hay.includes(cn)) return true;
  }
  return false;
}

function dropUngrounded(extracted: Record<string, unknown>, text: string, warnings: string[]): void {
  const hay = text.toLowerCase().replace(/[\s,]/g, "");
  for (const [table, fields] of Object.entries(GROUND_DROP)) {
    const row = extracted[table];
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    for (const f of fields) {
      const v = r[f];
      if (typeof v === "number" && Number.isFinite(v) && !numberInSource(v, hay)) {
        warnings.push(`grounding: dropped ${table}.${f}=${v} (not found in source)`);
        r[f] = null;
      }
    }
  }
  for (const table of LEAN_DISEASE_TABLES) {
    const rows = extracted[table];
    if (!Array.isArray(rows)) continue;
    for (const row of rows as Record<string, unknown>[]) {
      for (const f of LEAN_DROP_FIELDS) {
        const v = row[f];
        if (typeof v === "number" && Number.isFinite(v) && !numberInSource(v, hay)) {
          warnings.push(`grounding: dropped ${table}.${f}=${v} for ${String(row.county ?? "?")} (not found in source)`);
          row[f] = null;
        }
      }
    }
  }
}

function compactSnippet(s: string): string {
  return s.replace(/\s+/g, " ").trim().slice(0, 500);
}

function snippetAroundValue(source: string, value: number): string {
  const variants = numberVariants(value);
  const lower = source.toLowerCase();
  let idx = -1;
  for (const variant of variants) {
    idx = lower.indexOf(variant.toLowerCase());
    if (idx >= 0) break;
  }
  if (idx < 0) return compactSnippet(source);
  return compactSnippet(source.slice(Math.max(0, idx - 220), Math.min(source.length, idx + 280)));
}

function numberVariants(v: number): string[] {
  const out = new Set<string>([String(v), v.toLocaleString("en-US")]);
  for (const [div, suffixes] of [[1e6, ["million", "m"]], [1e3, ["thousand", "k"]]] as [number, string[]][]) {
    if (Math.abs(v) >= div) {
      const scaled = v / div;
      for (const f of new Set([String(scaled), scaled.toFixed(1), String(Math.round(scaled))])) {
        for (const suffix of suffixes) out.add(`${f} ${suffix}`);
      }
    }
  }
  return [...out].filter(Boolean).sort((a, b) => b.length - a.length);
}

function splitSourceBlocks(text: string): Array<{ source_type: EvidenceRow["source_type"]; slide_number?: number; text: string }> {
  const blocks: Array<{ source_type: EvidenceRow["source_type"]; slide_number?: number; text: string }> = [];
  const re = /### Slide (\d+)\n([\s\S]*?)(?=\n### Slide \d+\n|\n### Embedded Workbook: |$)/g;
  for (const m of text.matchAll(re)) {
    const slide_number = Number(m[1]);
    const body = m[2];
    const sections = [
      { marker: "#### Tables", type: "table" as const, idx: body.indexOf("#### Tables") },
      { marker: "#### Charts", type: "chart" as const, idx: body.indexOf("#### Charts") },
      { marker: "#### Speaker Notes", type: "notes" as const, idx: body.indexOf("#### Speaker Notes") },
    ].filter((s) => s.idx >= 0).sort((a, b) => a.idx - b.idx);
    const proseEnd = Math.min(
      ...sections.map((s) => s.idx),
      body.length,
    );
    const prose = body.slice(0, proseEnd);
    if (prose.trim()) blocks.push({ source_type: "text", slide_number, text: prose });
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const end = sections[i + 1]?.idx ?? body.length;
      blocks.push({ source_type: section.type, slide_number, text: body.slice(section.idx, end) });
    }
  }
  const workbookRe = /### Embedded Workbook: ([^\n]+)\n([\s\S]*?)(?=\n### Embedded Workbook: |$)/g;
  for (const m of text.matchAll(workbookRe)) {
    if (m[2].trim()) blocks.push({ source_type: "workbook", text: `${m[1]}\n${m[2]}` });
  }
  if (blocks.length === 0 && text.trim()) blocks.push({ source_type: "text", text });
  return blocks;
}

function findEvidence(
  blocks: Array<{ source_type: EvidenceRow["source_type"]; slide_number?: number; text: string }>,
  value: number,
  hints: string[] = [],
): EvidenceRow | null {
  if (!Number.isFinite(value)) return null;
  const variants = numberVariants(value).map((v) => v.toLowerCase().replace(/[\s,]/g, ""));
  const cleanHints = hints.map((h) => h.toLowerCase()).filter(Boolean);

  let best: EvidenceRow | null = null;
  let bestScore = -1;
  for (const block of blocks) {
    const normalized = block.text.toLowerCase().replace(/[\s,]/g, "");
    if (!variants.some((v) => v && normalized.includes(v))) continue;
    const hintHits = cleanHints.filter((h) => block.text.toLowerCase().includes(h)).length;
    const score =
      hintHits * 10 +
      (block.source_type === "table" ? 4 :
        block.source_type === "workbook" ? 4 :
          block.source_type === "chart" ? 3 :
            block.source_type === "notes" ? 2 : 1);
    if (score > bestScore) {
      bestScore = score;
      best = {
        field_path: "",
        value_text: String(value),
        numeric_value: value,
        source_type: block.source_type,
        slide_number: block.slide_number,
        source_snippet: snippetAroundValue(block.text, value),
        confidence: hintHits > 0 ? 0.9 : 0.7,
      };
    }
  }
  return best;
}

function addNumericEvidence(
  out: EvidenceRow[],
  blocks: Array<{ source_type: EvidenceRow["source_type"]; slide_number?: number; text: string }>,
  fieldPath: string,
  value: unknown,
  hints: string[] = [],
): void {
  if (typeof value !== "number" || !Number.isFinite(value)) return;
  // Zero is often a DB default or expressed as "no deaths"/"none", which this
  // numeric scanner cannot safely prove. Leave zero-evidence to the later
  // reconciliation/OCR pass rather than matching every "0" in dates or totals.
  if (value === 0) return;
  const ev = findEvidence(blocks, value, hints);
  if (!ev) return;
  out.push({ ...ev, field_path: fieldPath });
}

function buildExtractionEvidence(extracted: Record<string, unknown>, text: string): EvidenceRow[] {
  const blocks = splitSourceBlocks(text);
  const out: EvidenceRow[] = [];
  const obj = (key: string) => {
    const v = extracted[key];
    return v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : null;
  };
  const addFields = (table: string, fields: string[], hints: string[]) => {
    const row = obj(table);
    if (!row) return;
    for (const field of fields) addNumericEvidence(out, blocks, `${table}.${field}`, row[field], [...hints, field.replace(/_/g, " ")]);
  };

  addFields("report_summary", ["new_events", "outbreaks", "grade_1", "grade_2", "grade_3"], ["emergencies", "grade", "outbreak"]);
  addFields("mpox_data", GROUND_DROP.mpox_data, ["mpox"]);
  addFields("measles_data", GROUND_DROP.measles_data, ["measles"]);
  addFields("idsr_data", ["completeness_pct", "timeliness_pct", "cebs_community_signals"], ["idsr"]);
  addFields("nutrition_data", ["phase3_above", "phase4_5"], ["nutrition", "ipc"]);

  for (const table of ["mpox_counties", "measles_counties", ...LEAN_DISEASE_TABLES, "idsr_counties", "nutrition_counties"] as const) {
    const rows = extracted[table];
    if (!Array.isArray(rows)) continue;
    rows.slice(0, 80).forEach((row, i) => {
      if (!row || typeof row !== "object") return;
      const r = row as Record<string, unknown>;
      const place = String(r.county_name ?? r.county ?? r.sub_county ?? "");
      for (const field of ["cases_2026", "case_count", "cases", "deaths", "completeness_pct", "timeliness_pct", "population_affected"]) {
        addNumericEvidence(out, blocks, `${table}[${i}].${field}`, r[field], [table.replace(/_/g, " "), place, field.replace(/_/g, " ")]);
      }
    });
  }

  const seen = new Set<string>();
  return out.filter((r) => {
    const k = `${r.field_path}|${r.value_text}|${r.slide_number ?? ""}|${r.source_snippet.slice(0, 80)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function countEvidenceCandidateFields(extracted: Record<string, unknown>): number {
  const paths = new Set<string>();
  const obj = (key: string) => {
    const v = extracted[key];
    return v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : null;
  };
  const addFields = (table: string, fields: string[]) => {
    const row = obj(table);
    if (!row) return;
    for (const field of fields) {
      const value = row[field];
      if (typeof value === "number" && Number.isFinite(value) && value !== 0) paths.add(`${table}.${field}`);
    }
  };

  addFields("report_summary", ["new_events", "outbreaks", "grade_1", "grade_2", "grade_3"]);
  addFields("mpox_data", GROUND_DROP.mpox_data);
  addFields("measles_data", GROUND_DROP.measles_data);
  addFields("idsr_data", ["completeness_pct", "timeliness_pct", "cebs_community_signals"]);
  addFields("nutrition_data", ["phase3_above", "phase4_5"]);

  for (const table of ["mpox_counties", "measles_counties", ...LEAN_DISEASE_TABLES, "idsr_counties", "nutrition_counties"] as const) {
    const rows = extracted[table];
    if (!Array.isArray(rows)) continue;
    rows.slice(0, 80).forEach((row, i) => {
      if (!row || typeof row !== "object") return;
      const r = row as Record<string, unknown>;
      for (const field of ["cases_2026", "case_count", "cases", "deaths", "completeness_pct", "timeliness_pct", "population_affected"]) {
        const value = r[field];
        if (typeof value === "number" && Number.isFinite(value) && value !== 0) paths.add(`${table}[${i}].${field}`);
      }
    });
  }

  return paths.size;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const startedAt = Date.now();

    // --- auth ---
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { error: "Missing Authorization bearer token" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json(401, { error: "Invalid session" });
    const userId = userData.user.id;

    // --- body (JSON: storage path — the function downloads the file
    //     server-side so large decks never hit the inline request-body limit) ---
    const admin = createClient(supabaseUrl, serviceKey);
    let body: { file_path?: string; file_name?: string } | null;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "Expected JSON body { file_path, file_name }" });
    }
    const file_path = (body?.file_path ?? "").trim();
    const file_name = (body?.file_name ?? file_path.split("/").pop() ?? "").trim();
    if (!file_path || !file_name) {
      return json(400, { error: "Missing file_path in request" });
    }
    const extension = extensionOf(file_name);
    if (!REPORT_UPLOAD_EXTENSIONS.has(extension)) {
      return json(415, { error: "Unsupported file type. Upload .pptx, .pdf, .xlsx or .xls." });
    }
    const ownsUpload = file_path.startsWith(`${userId}/`);
    let canProcessLibraryDocument = false;
    if (file_path.startsWith("documents/")) {
      const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (roleErr) return json(500, { error: `Role check failed: ${roleErr.message}` });
      canProcessLibraryDocument = Boolean(isAdmin);
    }
    if (file_path.includes("..") || file_path.startsWith("/") || (!ownsUpload && !canProcessLibraryDocument)) {
      return json(403, { error: "You can only process your own uploads or admin library documents." });
    }
    const { data: fileData, error: dlError } = await admin.storage
      .from("weekly-uploads")
      .download(file_path);
    if (dlError || !fileData) {
      return json(400, {
        error: `Could not download file from storage: ${dlError?.message ?? "not found"}`,
      });
    }
    const bytes = new Uint8Array(await fileData.arrayBuffer());
    if (bytes.byteLength === 0) return json(422, { error: "Uploaded file is empty." });
    if (bytes.byteLength > MAX_UPLOAD_BYTES) {
      return json(413, { error: `Uploaded file is too large. Maximum size is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.` });
    }

    // --- parse to text ---
    const debug: Record<string, unknown> = {};
    let text: string;
    if (extension === "xlsx" || extension === "xls") {
      text = await extractXlsxText(bytes);
    } else if (extension === "pptx") {
      text = await extractPptxText(bytes, debug);
    } else if (extension === "pdf") {
      text = await extractPdfText(bytes);
    } else {
      return json(415, { error: "Unsupported file type. Upload .pptx, .pdf, .xlsx or .xls." });
    }

    debug.text_length = text.length;
    debug.text_preview = text.slice(0, 2000);
    console.log(`[extract] text_length=${text.length}`);
    console.log(`[extract] preview:\n${text.slice(0, 2000)}`);

    if (!text.trim()) return json(422, { error: "Could not extract any text from the file." });

    // --- document validation gate (fails open) ---
    const { valid } = await validateDocument(text, debug);
    if (!valid) {
      return json(422, {
        error:
          "This file does not look like a WHO Kenya / Kenya Ministry of Health weekly health surveillance report. Please upload the weekly surveillance report (PPTX, PDF, or Excel) that covers diseases such as Mpox, Measles, Ebola, Cholera, Dengue, IDSR and Nutrition by county.",
      });
    }

    // --- Claude extraction ---
    const extracted = await callClaude(text, debug);

    // --- insert weekly_reports first ---
    const tables_written: string[] = ["weekly_reports"];
    const warnings: string[] = [];

    if (typeof debug.truncated_chars === "number" && debug.truncated_chars > 0) {
      warnings.push(`Report text was truncated by ${debug.truncated_chars} characters before extraction — figures near the end may be missing. Consider splitting very large decks.`);
    }

    // --- second-pass verification: re-check numbers against the source and
    //     correct/flag discrepancies (fail-open) ---
    const verify = await verifyExtraction(text, extracted, debug);
    applyCorrections(extracted, verify.corrections, warnings);
    for (const note of verify.notes) warnings.push(`verify: ${note}`);
    validateRanges(extracted, warnings);
    dropUngrounded(extracted, text, warnings);

    const wr = (extracted.weekly_reports ?? {}) as Record<string, unknown>;
    const week_number = wr.week_number;
    const reporting_date = wr.reporting_date;

    const today = new Date();
    const resolved_week = typeof week_number === "number" ? week_number : isoWeek(today);
    const resolved_date = typeof reporting_date === "string" ? reporting_date : today.toISOString().slice(0, 10);
    if (resolved_week !== week_number || resolved_date !== reporting_date) {
      warnings.push(`week_number/reporting_date not found in report — defaulted to week ${resolved_week} / ${resolved_date}`);
    }

    const sourceBytes = await crypto.subtle.digest("SHA-256", bytes);
    const sourceSha256 = Array.from(new Uint8Array(sourceBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const { data: priorDrafts, error: priorDraftErr } = await admin
      .from("weekly_reports")
      .select("id")
      .eq("source_sha256", sourceSha256)
      .eq("published", false);
    if (priorDraftErr) {
      return json(500, { error: `Could not check existing drafts: ${priorDraftErr.message}` });
    }

    const { data: reportRow, error: reportErr } = await admin
      .from("weekly_reports")
      .insert({
        week_number: resolved_week,
        reporting_date: resolved_date,
        published: Boolean(wr.published ?? false),
        uploaded_by: userId,
        source_storage_path: file_path,
        source_sha256: sourceSha256,
      })
      .select("id")
      .single();
    if (reportErr || !reportRow) {
      return json(500, { error: `Insert weekly_reports failed: ${reportErr?.message}` });
    }
    const report_id: string = reportRow.id;

    const evidence = buildExtractionEvidence(extracted, text);
    const candidateFieldCount = countEvidenceCandidateFields(extracted);
    const groundedFieldCount = new Set(evidence.map((row) => row.field_path)).size;
    const evidenceCoveragePct =
      candidateFieldCount > 0 ? Math.round((groundedFieldCount / candidateFieldCount) * 100) : null;
    if (
      candidateFieldCount >= 4 &&
      evidenceCoveragePct !== null &&
      evidenceCoveragePct < 75
    ) {
      warnings.push(
        `evidence: only ${groundedFieldCount}/${candidateFieldCount} non-zero numeric fields (${evidenceCoveragePct}%) were linked to source text; review carefully before publishing.`,
      );
    }
    if (evidence.length) {
      const { error: evidenceErr } = await admin.from("report_extraction_evidence").insert(
        evidence.map((r) => ({
          report_id,
          field_path: r.field_path,
          value_text: r.value_text,
          numeric_value: r.numeric_value ?? null,
          source_type: r.source_type,
          slide_number: r.slide_number ?? null,
          source_snippet: r.source_snippet,
          confidence: r.confidence,
        })),
      );
      if (evidenceErr) warnings.push(`evidence: ${evidenceErr.message}`);
      else tables_written.push("report_extraction_evidence");
    } else {
      warnings.push("evidence: no numeric source evidence found for extracted figures");
    }

    // --- all table inserts in parallel ---
    const writeErrors: string[] = [];
    await Promise.all([
      ...SINGLE_ROW_TABLES.map(async (t) => {
        const row = extracted[t];
        if (!row || typeof row !== "object" || Array.isArray(row)) return;
        const { error } = await admin.from(t).insert({ ...stripNulls(row as object), report_id });
        if (error) writeErrors.push(`${t}: ${error.message}`);
        else tables_written.push(t);
      }),
      ...ARRAY_TABLES.map(async (t) => {
        const rows = extracted[t];
        if (!Array.isArray(rows) || rows.length === 0) return;
        const payload = rows.map((r) => ({ ...stripNulls(r as object), report_id }));
        const { error } = await admin.from(t).insert(payload);
        if (error) writeErrors.push(`${t}: ${error.message}`);
        else tables_written.push(t);
      }),
    ]);
    if (writeErrors.length > 0) {
      await admin.from("weekly_reports").delete().eq("id", report_id);
      return json(500, {
        error: "The extracted draft could not be saved completely. The existing report was left unchanged.",
        details: writeErrors,
      });
    }

    const oldDraftIds = (priorDrafts ?? [])
      .map((row: { id: string }) => row.id)
      .filter((id: string) => id !== report_id);
    if (oldDraftIds.length > 0) {
      const { error: cleanupErr } = await admin.from("weekly_reports").delete().in("id", oldDraftIds);
      if (cleanupErr) warnings.push(`draft cleanup: ${cleanupErr.message}`);
    }


    // Review gate: the report stays published=false (a DRAFT). It is NOT linked
    // to its document and is invisible to users until an admin verifies the
    // numbers against the source and publishes it (Admin → Documents / Reports).

    // --- seed the editable "Response notes" (Admin -> Page Content) from the
    //     AI-generated narrative, so admins can tweak the wording. Composed as a
    //     markdown blob per disease page; re-reading the document regenerates it. ---
    try {
      const NOTE_FIELDS: Record<string, [string, string][]> = {
        mpox: [["response_activities", "Response activities"], ["challenges", "Challenges"], ["genomic_subclade", "Genomic subclade"]],
        measles: [["response_activities", "Response activities"], ["clinical_notes", "Clinical notes"], ["epidemiological_summary", "Epidemiological summary"], ["laboratory_status", "Laboratory status"], ["strategic_updates", "Strategic updates"], ["challenges", "Challenges"]],
        nutrition: [["ipc_notes", "IPC notes"], ["key_drivers", "Key drivers"], ["contributing_factors", "Contributing factors"]],
      };
      // Lean (per-county array) disease pages — compose notes from the first row.
      const LEAN_NOTE_FIELDS: [string, string][] = [["response_updates", "Response updates"], ["response_activities", "Response activities"], ["gaps_next_steps", "Gaps & next steps"], ["prompt_action", "Prompt action"]];
      const LEAN_PAGES: Record<string, string> = { ebola: "ebola_data", cholera: "cholera_data", dengue: "dengue_data" };
      const compose = (src: Record<string, unknown> | null | undefined, fields: [string, string][]) => {
        if (!src) return "";
        const parts: string[] = [];
        for (const [key, label] of fields) {
          const v = src[key];
          if (typeof v === "string" && v.trim()) parts.push(`**${label}:** ${v.trim()}`);
        }
        return parts.join("\n\n");
      };
      const noteRows: Array<Record<string, unknown>> = [];
      const singleSrc: Record<string, Record<string, unknown> | undefined> = {
        mpox: extracted.mpox_data as Record<string, unknown> | undefined,
        measles: extracted.measles_data as Record<string, unknown> | undefined,
        nutrition: extracted.nutrition_data as Record<string, unknown> | undefined,
      };
      for (const [page, fields] of Object.entries(NOTE_FIELDS)) {
        const md = compose(singleSrc[page], fields);
        if (md) noteRows.push({ page_key: page, section_key: "response_notes", field_key: "more_info_md", value_text: md });
      }
      for (const [page, table] of Object.entries(LEAN_PAGES)) {
        const rows = extracted[table];
        if (Array.isArray(rows) && rows.length) {
          const md = compose(rows[0] as Record<string, unknown>, LEAN_NOTE_FIELDS);
          if (md) noteRows.push({ page_key: page, section_key: "response_notes", field_key: "more_info_md", value_text: md });
        }
      }

      // AI-generated commentary shown beside each chart/pie (SectionNotes).
      // Fail-open: on any error we skip and the page keeps its default text.
      try {
        const chartNotes = await generateChartNotes(extracted, debug);
        const CHART_SECTIONS: Record<string, string[]> = {
          mpox: ["epi_curve", "distribution", "demographics", "deaths_hiv", "deaths_analysis"],
          measles: ["epi_curve", "demographics"],
        };
        for (const [page, secs] of Object.entries(CHART_SECTIONS)) {
          const byPage = (chartNotes?.[page] ?? {}) as Record<string, unknown>;
          for (const sec of secs) {
            const v = byPage[sec];
            if (typeof v === "string" && v.trim()) {
              noteRows.push({ page_key: page, section_key: sec, field_key: "notes_md", value_text: v.trim() });
            }
          }
        }
      } catch (e) {
        warnings.push(`chart notes: ${e instanceof Error ? e.message : String(e)}`);
      }

      if (noteRows.length) {
        const { error: pcErr } = await admin
          .from("page_content")
          .upsert(noteRows, { onConflict: "page_key,section_key,field_key" });
        if (pcErr) warnings.push(`page_content: ${pcErr.message}`);
      }
    } catch (e) {
      warnings.push(`page_content seed: ${e instanceof Error ? e.message : String(e)}`);
    }

    // --- audit log (best-effort) ---
    await admin
      .from("audit_log")
      .insert({
        user_id: userId,
        action: "process_upload",
        table_name: "weekly_reports",
        report_id,
        details: {
          file_name,
          week_number: resolved_week,
          tables_written: tables_written.length,
          duration_ms: Date.now() - startedAt,
        },
      })
      .then(() => {}, () => {});

    // Compact preview of the headline figures so the admin can eyeball them
    // against the source deck in the read-in summary before publishing.
    const pick = (o: unknown, k: string): number | null => {
      if (!o || typeof o !== "object" || Array.isArray(o)) return null;
      const v = (o as Record<string, unknown>)[k];
      return typeof v === "number" ? v : null;
    };
    const sumArr = (rows: unknown, k: string): number | null => {
      if (!Array.isArray(rows) || rows.length === 0) return null;
      return (rows as Record<string, unknown>[]).reduce((s, r) => s + (typeof r[k] === "number" ? (r[k] as number) : 0), 0);
    };
    const countiesArr = (rows: unknown): number | null => {
      if (!Array.isArray(rows) || rows.length === 0) return null;
      return new Set((rows as Record<string, unknown>[]).map((r) => r.county).filter(Boolean)).size;
    };
    const preview: Record<string, Record<string, number | null>> = {
      report_summary: {
        new_events: pick(extracted.report_summary, "new_events"),
        outbreaks: pick(extracted.report_summary, "outbreaks"),
        grade_1: pick(extracted.report_summary, "grade_1"),
        grade_2: pick(extracted.report_summary, "grade_2"),
        grade_3: pick(extracted.report_summary, "grade_3"),
      },
      mpox: {
        cumulative_cases: pick(extracted.mpox_data, "cumulative_cases"),
        new_cases_this_week: pick(extracted.mpox_data, "new_cases_this_week"),
        deaths: pick(extracted.mpox_data, "deaths"),
        cfr: pick(extracted.mpox_data, "cfr"),
        counties_affected: pick(extracted.mpox_data, "counties_affected"),
      },
      measles: {
        total_cases: pick(extracted.measles_data, "total_cases"),
        confirmed: pick(extracted.measles_data, "confirmed"),
        suspected: pick(extracted.measles_data, "suspected"),
        counties_affected: pick(extracted.measles_data, "counties_affected"),
      },
      ebola: { cases: sumArr(extracted.ebola_data, "cases"), deaths: sumArr(extracted.ebola_data, "deaths"), counties: countiesArr(extracted.ebola_data) },
      cholera: { cases: sumArr(extracted.cholera_data, "cases"), deaths: sumArr(extracted.cholera_data, "deaths"), counties: countiesArr(extracted.cholera_data) },
      dengue: { cases: sumArr(extracted.dengue_data, "cases"), deaths: sumArr(extracted.dengue_data, "deaths"), counties: countiesArr(extracted.dengue_data) },
    };

    const evidence_summary = {
      rows: evidence.length,
      candidate_fields: candidateFieldCount,
      grounded_fields: groundedFieldCount,
      coverage_pct: evidenceCoveragePct,
      by_source_type: evidence.reduce((acc, row) => {
        acc[row.source_type] = (acc[row.source_type] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      headline_fields: evidence
        .filter((row) =>
          row.field_path.startsWith("report_summary.") ||
          row.field_path.startsWith("mpox_data.") ||
          row.field_path.startsWith("measles_data.") ||
          row.field_path.startsWith("idsr_data.") ||
          row.field_path.startsWith("nutrition_data."),
        )
        .slice(0, 30)
        .map((row) => ({
          field_path: row.field_path,
          value_text: row.value_text,
          source_type: row.source_type,
          slide_number: row.slide_number ?? null,
          source_snippet: row.source_snippet,
          confidence: row.confidence,
        })),
    };

    return json(200, {
      report_id,
      week_number: resolved_week,
      reporting_date: resolved_date,
      published: false,
      tables_written,
      warnings,
      preview,
      evidence_summary,
      debug,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("process-upload error:", msg);
    return json(500, { error: msg });
  }
});
