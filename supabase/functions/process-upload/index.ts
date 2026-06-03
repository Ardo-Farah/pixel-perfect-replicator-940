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
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

const SCHEMA_DOC = `
You will receive raw text extracted from a weekly health surveillance report
(PPTX or Excel) from Kenya's Ministry of Health / WHO. Extract every value you
can find and return STRICT JSON matching the shape below.

Rules:
- Output ONE JSON object only. No prose, no markdown.
- Use null for any field you cannot confidently find. Do NOT invent values.
- Numbers must be numbers (not strings). Percentages as numeric (e.g. 87.5 not "87.5%").
- IMPORTANT: figures are often stated INSIDE prose sentences, bullets, or slide
  text (e.g. "1,376 contacts listed and 1,141 completed follow-up", "10.2 million
  travellers screened", "39 counties affected"). Pull every such figure into its
  matching numeric field — do NOT leave a numeric field null when its value
  appears anywhere in the report. Strip thousands separators ("1,376" -> 1376) and
  expand units ("10.2 million" -> 10200000, "3.3M" -> 3300000). Still never invent
  a figure that is not stated.
- report_summary.grade_1 / grade_2 / grade_3 = the COUNT of emergencies currently
  classified at WHO grade 1, 2 and 3 respectively (read the emergencies / grading
  overview; e.g. a Grade 2 Mpox emergency counts as grade_2 = 1). new_events and
  outbreaks are the totals stated for the week.
- Dates as ISO YYYY-MM-DD.
- Arrays may be empty [] if no rows are present.
- For floods_data, region death columns are named like "coast_deaths",
  "rift_valley_deaths", "nyanza_deaths", "western_deaths", "central_deaths",
  "eastern_deaths", "north_eastern_deaths", "nairobi_deaths". Include any you find.
- Narrative / notes fields (response_activities, challenges, clinical_notes,
  epidemiological_summary, laboratory_status, strategic_updates, genomic_subclade,
  response_updates, prompt_action, gaps_next_steps, health_facility_status,
  supplies_logistics, epidemiological_risks, public_health_risks, response_actions,
  ipc_notes, key_drivers, contributing_factors): WRITE these as concise, professional
  1–3 sentence summaries that synthesize what THIS report shows for that disease
  (case counts and trends, hardest-hit counties, deaths/CFR, response actions, gaps).
  Prefer the report's own wording where it provides a relevant paragraph, but you MAY
  author the summary yourself when the source has no explicit narrative. Do NOT
  fabricate specific numbers, counties, or dates that the data does not support —
  summarize only what the figures show. Use null only when there is genuinely nothing
  to say for that disease. For anthrax_data, put the same response_updates,
  prompt_action, response_activities and gaps_next_steps on every row.

Shape:
{
  "weekly_reports":      { "week_number": number, "reporting_date": "YYYY-MM-DD", "published": false },
  "report_summary":      { "new_events": number|null, "outbreaks": number|null, "grade_1": number|null, "grade_2": number|null, "grade_3": number|null },
  "mpox_data":           { "cumulative_cases": number|null, "new_cases_this_week": number|null, "deaths": number|null, "cfr": number|null, "counties_affected": number|null, "recovered": number|null, "active_facility": number|null, "active_home": number|null, "contacts_listed": number|null, "contacts_completed": number|null, "contacts_follow_up": number|null, "vaccinations": number|null, "traveller_screenings": number|null, "hiv_co_infection_deaths": number|null, "response_activities": string|null, "challenges": string|null, "genomic_subclade": string|null },
  "mpox_counties":       [ { "county_name": string, "cases_2026": number|null, "is_hotspot": boolean|null } ],
  "mpox_demographics":   [ { "age_group": string|null, "sex": string|null, "occupation": string|null, "case_count": number|null } ],
  "measles_data":        { "total_cases": number|null, "confirmed": number|null, "suspected": number|null, "counties_affected": number|null, "response_activities": string|null, "challenges": string|null, "clinical_notes": string|null, "epidemiological_summary": string|null, "laboratory_status": string|null, "strategic_updates": string|null },
  "measles_counties":    [ { "county_name": string, "sub_county": string|null, "case_count": number|null } ],
  "anthrax_data":        [ { "county": string, "sub_county": string|null, "human_cases": number|null, "human_deaths": number|null, "animal_deaths": number|null, "response_updates": string|null, "prompt_action": string|null, "response_activities": string|null, "gaps_next_steps": string|null } ],
  "floods_data":         { "counties_affected": number|null, "total_deaths": number|null, "missing_persons": number|null, "coast_deaths": number|null, "rift_valley_deaths": number|null, "nyanza_deaths": number|null, "western_deaths": number|null, "central_deaths": number|null, "eastern_deaths": number|null, "north_eastern_deaths": number|null, "nairobi_deaths": number|null, "public_health_risks": string|null, "response_actions": string|null, "challenges": string|null, "health_facility_status": string|null, "supplies_logistics": string|null, "epidemiological_risks": string|null, "prompt_action": string|null },
  "idsr_data":           { "completeness_pct": number|null, "timeliness_pct": number|null, "cebs_community_signals": number|null },
  "idsr_counties":       [ { "county_name": string, "completeness_pct": number|null, "timeliness_pct": number|null, "below_threshold": boolean|null } ],
  "nutrition_data":      { "phase3_above": number|null, "phase4_5": number|null, "ipc_notes": string|null, "key_drivers": string|null, "contributing_factors": string|null },
  "nutrition_counties":  [ { "county_name": string, "ipc_phase": number|null, "projected_phase": number|null, "population_affected": number|null } ],
  "weather_data":        [ { "region": string, "max_temp_c": number|null, "min_temp_c": number|null, "rainfall_onset": string|null } ]
}
`.trim();

// Single-row tables (object) vs array tables. weekly_reports handled separately.
const SINGLE_ROW_TABLES = [
  "report_summary",
  "mpox_data",
  "measles_data",
  "floods_data",
  "idsr_data",
  "nutrition_data",
] as const;

const ARRAY_TABLES = [
  "mpox_counties",
  "mpox_demographics",
  "measles_counties",
  "anthrax_data",
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

async function extractPptxText(
  bytes: Uint8Array,
  debug: Record<string, unknown>,
): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const slideFiles = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/)![1], 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/)![1], 10);
      return na - nb;
    });
  debug.pptx_slides = slideFiles.length;
  console.log(`[pptx] slides found: ${slideFiles.length}`);
  const parts: string[] = [];
  for (const path of slideFiles) {
    const xml = await zip.files[path].async("string");
    // Concatenate text runs with spaces, then strip remaining tags.
    const text = xml
      .replace(/<a:t[^>]*>/g, " ")
      .replace(/<\/a:t>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    parts.push(`### Slide ${path.match(/slide(\d+)/)![1]}\n${text}`);
  }
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
              "Does the following text look like a WHO Kenya or Kenya Ministry of Health WEEKLY HEALTH SURVEILLANCE report? Look for: disease names (Mpox, Measles, Anthrax, Floods, cholera), Kenyan county names, health metrics / case counts, and WHO or Ministry of Health references. Answer YES if it plausibly is such a report; answer NO only if it clearly is not (e.g. an invoice, resume, contract, random document). Answer with only YES or NO.\n\n--- TEXT START ---\n" +
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
  const model = Deno.env.get("ANTHROPIC_MODEL") || DEFAULT_ANTHROPIC_MODEL;

  // Keep requests comfortably under edge/API limits while preserving most reports.
  const MAX_CHARS = 160_000;
  const payloadText = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 8000,
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
  const model = Deno.env.get("ANTHROPIC_MODEL") || DEFAULT_ANTHROPIC_MODEL;
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
      temperature: 0,
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
    if (file_path.includes("..") || file_path.startsWith("/") || !file_path.startsWith(`${userId}/`)) {
      return json(403, { error: "You can only process files uploaded under your own account." });
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

    // --- parse to text ---
    const debug: Record<string, unknown> = {};
    const lower = file_name.toLowerCase();
    let text: string;
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      text = await extractXlsxText(bytes);
    } else if (lower.endsWith(".pptx")) {
      text = await extractPptxText(bytes, debug);
    } else if (lower.endsWith(".pdf")) {
      text = await extractPdfText(bytes);
    } else {
      return json(415, { error: "Unsupported file type. Upload .pdf, .pptx, .xlsx or .xls." });
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
          "This file does not look like a WHO Kenya / Kenya Ministry of Health weekly health surveillance report. Please upload the weekly surveillance report (PPTX, PDF, or Excel) that covers diseases such as Mpox, Measles, Anthrax, Floods, IDSR and Nutrition by county.",
      });
    }

    // --- Claude extraction ---
    const extracted = await callClaude(text, debug);

    // --- insert weekly_reports first ---
    const tables_written: string[] = ["weekly_reports"];
    const warnings: string[] = [];

    const wr = (extracted.weekly_reports ?? {}) as Record<string, unknown>;
    const week_number = wr.week_number;
    const reporting_date = wr.reporting_date;

    const today = new Date();
    const resolved_week = typeof week_number === "number" ? week_number : isoWeek(today);
    const resolved_date = typeof reporting_date === "string" ? reporting_date : today.toISOString().slice(0, 10);
    if (resolved_week !== week_number || resolved_date !== reporting_date) {
      warnings.push(`week_number/reporting_date not found in report — defaulted to week ${resolved_week} / ${resolved_date}`);
    }

    // Re-upload replaces ALL existing reports for this epi-week (not just the
    // exact date), so re-reading the same bulletin updates its report in place
    // instead of leaving duplicate "Week N" entries behind. Child tables
    // cascade-delete via FK ON DELETE CASCADE; documents.report_id is ON DELETE
    // SET NULL so a stale link simply shows "not read" until re-linked.
    if (resolved_week != null && resolved_week !== undefined) {
      await admin.from("weekly_reports").delete().eq("week_number", resolved_week);
    } else {
      await admin.from("weekly_reports").delete().eq("reporting_date", resolved_date);
    }

    const { data: reportRow, error: reportErr } = await admin
      .from("weekly_reports")
      .insert({
        week_number: resolved_week,
        reporting_date: resolved_date,
        published: Boolean(wr.published ?? false),
        uploaded_by: userId,
      })
      .select("id")
      .single();
    if (reportErr || !reportRow) {
      return json(500, { error: `Insert weekly_reports failed: ${reportErr?.message}` });
    }
    const report_id: string = reportRow.id;

    // --- all table inserts in parallel ---
    await Promise.all([
      ...SINGLE_ROW_TABLES.map(async (t) => {
        const row = extracted[t];
        if (!row || typeof row !== "object" || Array.isArray(row)) return;
        const { error } = await admin.from(t).insert({ ...stripNulls(row as object), report_id });
        if (error) warnings.push(`${t}: ${error.message}`);
        else tables_written.push(t);
      }),
      ...ARRAY_TABLES.map(async (t) => {
        const rows = extracted[t];
        if (!Array.isArray(rows) || rows.length === 0) return;
        const payload = rows.map((r) => ({ ...stripNulls(r as object), report_id }));
        const { error } = await admin.from(t).insert(payload);
        if (error) warnings.push(`${t}: ${error.message}`);
        else tables_written.push(t);
      }),
    ]);

    // Publish only after all disease tables are written, so the dashboard
    // (which filters published=true) never shows a half-written report.
    await admin.from("weekly_reports").update({ published: true }).eq("id", report_id);

    // --- seed the editable "Response notes" (Admin -> Page Content) from the
    //     AI-generated narrative, so admins can tweak the wording. Composed as a
    //     markdown blob per disease page; re-reading the document regenerates it. ---
    try {
      const NOTE_FIELDS: Record<string, [string, string][]> = {
        mpox: [["response_activities", "Response activities"], ["challenges", "Challenges"], ["genomic_subclade", "Genomic subclade"]],
        measles: [["response_activities", "Response activities"], ["clinical_notes", "Clinical notes"], ["epidemiological_summary", "Epidemiological summary"], ["laboratory_status", "Laboratory status"], ["strategic_updates", "Strategic updates"], ["challenges", "Challenges"]],
        floods: [["public_health_risks", "Public health risks"], ["response_actions", "Response actions"], ["health_facility_status", "Health facility status"], ["supplies_logistics", "Supplies & logistics"], ["epidemiological_risks", "Epidemiological risks"], ["prompt_action", "Prompt action"], ["challenges", "Challenges"]],
        nutrition: [["ipc_notes", "IPC notes"], ["key_drivers", "Key drivers"], ["contributing_factors", "Contributing factors"]],
      };
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
        floods: extracted.floods_data as Record<string, unknown> | undefined,
        nutrition: extracted.nutrition_data as Record<string, unknown> | undefined,
      };
      for (const [page, fields] of Object.entries(NOTE_FIELDS)) {
        const md = compose(singleSrc[page], fields);
        if (md) noteRows.push({ page_key: page, section_key: "response_notes", field_key: "more_info_md", value_text: md });
      }
      const anthraxRows = extracted.anthrax_data;
      if (Array.isArray(anthraxRows) && anthraxRows.length) {
        const md = compose(anthraxRows[0] as Record<string, unknown>, [["response_updates", "Response updates"], ["response_activities", "Response activities"], ["gaps_next_steps", "Gaps & next steps"], ["prompt_action", "Prompt action"]]);
        if (md) noteRows.push({ page_key: "anthrax", section_key: "response_notes", field_key: "more_info_md", value_text: md });
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

    return json(200, {
      report_id,
      week_number: resolved_week,
      reporting_date: resolved_date,
      tables_written,
      warnings,
      debug,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("process-upload error:", msg);
    return json(500, { error: msg });
  }
});
