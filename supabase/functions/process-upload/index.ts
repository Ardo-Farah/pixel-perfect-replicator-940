// Edge Function: process-upload
// Runtime: Deno (Supabase Edge Functions)
//
// Paste the contents of this file into the `process-upload` function in the
// Supabase dashboard for project xewepnpqhwxsqiqhbfyr and deploy.
//
// Required secrets (Project Settings -> Edge Functions -> Secrets):
//   DEEPSEEK_API_KEY            -- from https://platform.deepseek.com
//   SUPABASE_URL                -- auto-provided
//   SUPABASE_SERVICE_ROLE_KEY   -- auto-provided
//   SUPABASE_ANON_KEY           -- auto-provided (used for JWT verification)
//
// Request:  POST { file_path: string, file_name: string }  + Authorization: Bearer <user JWT>
// Response: { report_id, week_number, reporting_date, tables_written: string[] }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

const SCHEMA_DOC = `
You will receive raw text extracted from a weekly health surveillance report
(PPTX or Excel) from Kenya's Ministry of Health / WHO. Extract every value you
can find and return STRICT JSON matching the shape below.

Rules:
- Output ONE JSON object only. No prose, no markdown.
- Use null for any field you cannot confidently find. Do NOT invent values.
- Numbers must be numbers (not strings). Percentages as numeric (e.g. 87.5 not "87.5%").
- Dates as ISO YYYY-MM-DD.
- Arrays may be empty [] if no rows are present.
- For floods_data, region death columns are named like "coast_deaths",
  "rift_valley_deaths", "nyanza_deaths", "western_deaths", "central_deaths",
  "eastern_deaths", "north_eastern_deaths", "nairobi_deaths". Include any you find.

Shape:
{
  "weekly_reports":      { "week_number": number, "reporting_date": "YYYY-MM-DD", "published": false },
  "report_summary":      { "new_events": number|null, "outbreaks": number|null, "grade_1": number|null, "grade_2": number|null, "grade_3": number|null },
  "mpox_data":           { "cumulative_cases": number|null, "new_cases_this_week": number|null, "deaths": number|null, "cfr": number|null, "counties_affected": number|null },
  "mpox_counties":       [ { "county_name": string, "cases_2026": number|null, "is_hotspot": boolean|null } ],
  "mpox_demographics":   [ { "age_group": string|null, "sex": string|null, "occupation": string|null, "case_count": number|null } ],
  "measles_data":        { "total_cases": number|null, "confirmed": number|null, "suspected": number|null, "counties_affected": number|null },
  "measles_counties":    [ { "county_name": string, "sub_county": string|null, "case_count": number|null } ],
  "anthrax_data":        [ { "county": string, "sub_county": string|null, "human_cases": number|null, "human_deaths": number|null, "animal_deaths": number|null } ],
  "floods_data":         { "counties_affected": number|null, "total_deaths": number|null, "missing_persons": number|null, "coast_deaths": number|null, "rift_valley_deaths": number|null, "nyanza_deaths": number|null, "western_deaths": number|null, "central_deaths": number|null, "eastern_deaths": number|null, "north_eastern_deaths": number|null, "nairobi_deaths": number|null },
  "idsr_data":           { "completeness_pct": number|null, "timeliness_pct": number|null, "cebs_community_signals": number|null },
  "idsr_counties":       [ { "county_name": string, "completeness_pct": number|null, "timeliness_pct": number|null, "below_threshold": boolean|null } ],
  "nutrition_data":      { "phase3_above": number|null, "phase4_5": number|null, "ipc_notes": string|null },
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

async function extractPptxText(bytes: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const slideFiles = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/)![1], 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/)![1], 10);
      return na - nb;
    });
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

async function callDeepseek(text: string): Promise<Record<string, unknown>> {
  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!apiKey) throw new Error("Missing DEEPSEEK_API_KEY secret");

  // DeepSeek has a context window; truncate very large inputs defensively.
  const MAX_CHARS = 120_000;
  const payloadText = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a disease-surveillance data extractor. Return ONLY a single JSON object matching the schema the user gives you. Use null for unknown values. Never invent numbers.",
        },
        {
          role: "user",
          content: `${SCHEMA_DOC}\n\n--- REPORT TEXT START ---\n${payloadText}\n--- REPORT TEXT END ---`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${errText.slice(0, 500)}`);
  }
  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned empty content");
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("DeepSeek did not return valid JSON");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
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

    // --- body ---
    const body = await req.json().catch(() => null);
    const file_path: string | undefined = body?.file_path;
    const file_name: string | undefined = body?.file_name;
    if (!file_path || !file_name) {
      return json(400, { error: "Missing required fields: file_path, file_name" });
    }

    // --- download file (service role bypasses RLS) ---
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: fileBlob, error: dlErr } = await admin.storage
      .from("weekly-uploads")
      .download(file_path);
    if (dlErr || !fileBlob) {
      return json(404, { error: `Could not download file: ${dlErr?.message ?? "not found"}` });
    }
    const bytes = new Uint8Array(await fileBlob.arrayBuffer());

    // --- parse to text ---
    const lower = file_name.toLowerCase();
    let text: string;
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      text = await extractXlsxText(bytes);
    } else if (lower.endsWith(".pptx")) {
      text = await extractPptxText(bytes);
    } else if (lower.endsWith(".pdf")) {
      return json(415, { error: "PDF uploads are not yet supported. Please upload PPTX or Excel." });
    } else {
      return json(415, { error: "Unsupported file type. Upload .pptx, .xlsx or .xls." });
    }

    if (!text.trim()) return json(422, { error: "Could not extract any text from the file." });

    // --- DeepSeek extraction ---
    const extracted = await callDeepseek(text);

    // --- insert weekly_reports first ---
    const wr = (extracted.weekly_reports ?? {}) as Record<string, unknown>;
    const week_number = wr.week_number;
    const reporting_date = wr.reporting_date;
    if (typeof week_number !== "number" || typeof reporting_date !== "string") {
      return json(422, {
        error: "DeepSeek could not determine week_number or reporting_date from the report.",
      });
    }

    const { data: reportRow, error: reportErr } = await admin
      .from("weekly_reports")
      .insert({
        week_number,
        reporting_date,
        published: Boolean(wr.published ?? false),
      })
      .select("id")
      .single();
    if (reportErr || !reportRow) {
      return json(500, { error: `Insert weekly_reports failed: ${reportErr?.message}` });
    }
    const report_id: string = reportRow.id;

    const tables_written: string[] = ["weekly_reports"];
    const warnings: string[] = [];

    // --- single-row tables ---
    for (const t of SINGLE_ROW_TABLES) {
      const row = extracted[t];
      if (row && typeof row === "object" && !Array.isArray(row)) {
        const { error } = await admin.from(t).insert({ ...(row as object), report_id });
        if (error) warnings.push(`${t}: ${error.message}`);
        else tables_written.push(t);
      }
    }

    // --- array tables ---
    for (const t of ARRAY_TABLES) {
      const rows = extracted[t];
      if (Array.isArray(rows) && rows.length > 0) {
        const payload = rows.map((r) => ({ ...(r as object), report_id }));
        const { error } = await admin.from(t).insert(payload);
        if (error) warnings.push(`${t}: ${error.message}`);
        else tables_written.push(t);
      }
    }

    // --- audit log (best-effort) ---
    await admin
      .from("audit_log")
      .insert({
        user_id: userId,
        action: "process_upload",
        table_name: "weekly_reports",
        report_id,
      })
      .then(() => {}, () => {});

    return json(200, {
      report_id,
      week_number,
      reporting_date,
      tables_written,
      warnings,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("process-upload error:", msg);
    return json(500, { error: msg });
  }
});
