// Edge Function: chat
// Runtime: Deno (Supabase Edge Functions)
//
// The Clinical Assistant chat. Runs entirely on Supabase so the Anthropic key
// lives ONLY as a Supabase Edge secret — Lovable (or any app host) never needs
// an LLM key. The browser calls this function directly with the signed-in
// user's JWT; data is read under that user's RLS via the anon key (no service
// role). Streams an AI-SDK UI message stream that the existing useChat() client
// renders unchanged.
//
// Required secrets (Project Settings -> Edge Functions -> Secrets):
//   ANTHROPIC_API_KEY           -- from https://console.anthropic.com
//   ANTHROPIC_MODEL             -- optional, defaults to claude-sonnet-5
//   SUPABASE_URL                -- auto-provided
//   SUPABASE_ANON_KEY           -- auto-provided (token-scoped reads/writes)
//
// Request:  POST { messages: UIMessage[] } + Authorization: Bearer <user JWT>
// Response: AI-SDK UI message stream (text/event-stream style)

// Use Deno's npm: specifiers (not esm.sh): esm.sh's bundle of the AI SDK
// mis-validated converted messages at runtime ("messages do not match the
// ModelMessage[] schema"), while npm: resolution matches the working local
// build and keeps a single zod instance shared with the AI SDK.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.105.4";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@2.0.47";
import {
  convertToModelMessages,
  streamText,
  tool,
  stepCountIs,
  type UIMessage,
} from "npm:ai@6.0.184";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_MODEL = "claude-sonnet-5";

function configuredModel(): string {
  const configured = (Deno.env.get("ANTHROPIC_MODEL") || DEFAULT_MODEL).trim();
  if (configured === "claude-sonnet-4-20250514") return DEFAULT_MODEL;
  return configured;
}

// MIRRORS src/lib/diseases.ts — keep this list aligned with the dashboard config
// when adding/removing a disease section.
const DISEASE_DEFS = [
  { key: "mpox", label: "Mpox", county: { table: "mpox_counties", countyCol: "county_name", valueCol: "cases_2026" }, trend: { table: "mpox_data", col: "new_cases_this_week" } },
  { key: "measles", label: "Measles", county: { table: "measles_counties", countyCol: "county_name", valueCol: "case_count" }, trend: { table: "measles_data", col: "total_cases" } },
  { key: "ebola", label: "Ebola", county: { table: "ebola_data", countyCol: "county", valueCol: "cases" }, trend: { table: "ebola_data", col: "cases", aggregate: "sum" as const } },
  { key: "cholera", label: "Cholera", county: { table: "cholera_data", countyCol: "county", valueCol: "cases" }, trend: { table: "cholera_data", col: "cases", aggregate: "sum" as const } },
  { key: "dengue", label: "Dengue Fever", county: { table: "dengue_data", countyCol: "county", valueCol: "cases" }, trend: { table: "dengue_data", col: "cases", aggregate: "sum" as const } },
  { key: "nutrition", label: "Nutrition", county: { table: "nutrition_counties", countyCol: "county_name", valueCol: "population_affected" }, trend: { table: "nutrition_data", col: "phase4_5" } },
] as const;

const DISEASE_KEYS = DISEASE_DEFS.map((d) => d.key) as [string, ...string[]];
const diseaseSchema = z.enum(DISEASE_KEYS);
type Disease = string;

// Anthropic (Claude) via its OpenAI-compatible endpoint, reusing the
// openai-compatible provider (tool calling + streaming, standard bearer auth).
const createAnthropicProvider = (anthropicApiKey: string) =>
  createOpenAICompatible({
    name: "anthropic",
    baseURL: "https://api.anthropic.com/v1",
    headers: { Authorization: `Bearer ${anthropicApiKey}` },
  });

// ---- Live data accessors (inlined from src/lib/idsr-data.ts) ---------------

type SB = SupabaseClient;
type LatestReport = { id: string; week_number: number } | null;

function labelize(d: Disease) {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

async function getLatestReport(sb: SB): Promise<LatestReport> {
  const { data } = await sb
    .from("weekly_reports")
    .select("id, week_number")
    .eq("published", true)
    .order("week_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as LatestReport) ?? null;
}

const COUNTY_CASES: Record<string, { table: string; countyCol: string; valueCol: string } | null> =
  Object.fromEntries(DISEASE_DEFS.map((d) => [d.key, { ...d.county }]));

async function getCasesByCounty(sb: SB, reportId: string | null, disease: Disease, week: number | null) {
  const cfg = COUNTY_CASES[disease];
  const items: { label: string; value: number }[] = [];
  if (cfg && reportId) {
    const { data } = await sb.from(cfg.table).select(`${cfg.countyCol}, ${cfg.valueCol}`).eq("report_id", reportId);
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      const label = String(row[cfg.countyCol] ?? "").trim();
      const raw = Number(row[cfg.valueCol] ?? 0);
      if (label) items.push({ label, value: Number.isFinite(raw) ? raw : 0 });
    }
    items.sort((a, b) => b.value - a.value);
  }
  const total = items.reduce((s, i) => s + i.value, 0);
  const top = items[0];
  const callout = !cfg
    ? `County-level case counts aren't tracked for ${labelize(disease)}.`
    : items.length === 0
      ? `No county data found for ${labelize(disease)} in the latest report.`
      : top
        ? `${top.label} accounts for ${Math.round((top.value / Math.max(total, 1)) * 100)}% of recorded ${labelize(disease)} cases.`
        : undefined;
  return { type: "bar_by_county" as const, title: `${labelize(disease)} cases by county${week ? ` — week ${week}` : ""}`, items, callout };
}

const TREND_METRIC: Record<string, { table: string; col: string; aggregate?: "sum" }> =
  Object.fromEntries(DISEASE_DEFS.map((d) => [d.key, { ...d.trend }]));

async function getTrend(sb: SB, disease: Disease, weeks = 6) {
  const { data: reportsData } = await sb
    .from("weekly_reports")
    .select("id, week_number")
    .eq("published", true)
    .order("week_number", { ascending: false })
    .limit(weeks);
  const reports = ((reportsData ?? []) as { id: string; week_number: number }[]).slice().reverse();
  const cfg = TREND_METRIC[disease];
  const ids = reports.map((r) => r.id);
  const valueByReport = new Map<string, number>();
  if (ids.length) {
    const { data } = await sb.from(cfg.table).select(`report_id, ${cfg.col}`).in("report_id", ids);
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      const rid = String(row.report_id);
      const v = Number(row[cfg.col] ?? 0) || 0;
      if (cfg.aggregate === "sum") valueByReport.set(rid, (valueByReport.get(rid) ?? 0) + v);
      else valueByReport.set(rid, v);
    }
  }
  const series = reports.map((r) => ({ week: `W${r.week_number}`, value: valueByReport.get(r.id) ?? 0 }));
  const first = series[0]?.value ?? 0;
  const last = series[series.length - 1]?.value ?? 0;
  const delta = first ? Math.round(((last - first) / first) * 100) : 0;
  const callout =
    series.length === 0
      ? "No published reports available yet."
      : delta >= 0
        ? `Up ${delta}% over the period (${first} → ${last}).`
        : `Down ${Math.abs(delta)}% over the period (${first} → ${last}).`;
  return { type: "trend_line" as const, title: `${labelize(disease)} weekly trend — last ${series.length} week(s)`, series, callout };
}

function getMapHint(disease: Disease, area: string) {
  return {
    type: "map_hint" as const,
    title: `${labelize(disease)} map — ${area}`,
    area,
    note: `Hotspot view for ${area} is available on the ${labelize(disease)} dashboard page.`,
  };
}

// ---- Handler ---------------------------------------------------------------

function authedClient(token: string) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }
  const token = authHeader.slice(7);
  const sb = authedClient(token);

  const { data: userData, error: userErr } = await sb.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }
  const userId = userData.user.id;

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response("Missing ANTHROPIC_API_KEY", { status: 500, headers: corsHeaders });
  }

  const body = (await request.json()) as { messages?: UIMessage[] };
  const messages = body.messages ?? [];
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("messages required", { status: 400, headers: corsHeaders });
  }

  const latest = await getLatestReport(sb);
  const reportId = latest?.id ?? null;
  const week = latest?.week_number ?? null;

  const systemPrompt = `You are the Updates AI assistant.
You help health officials explore IDSR surveillance data for ${DISEASE_DEFS.map((d) => d.label).join(", ")} in Kenya.

When the user asks for breakdowns by county, trends, regional deaths, or maps, ALWAYS call the appropriate tool to fetch the data; the UI will render an inline chart widget from the tool result. After calling a tool, write one short sentence summarizing the insight — do not repeat the numbers, the widget shows them. If a tool returns no items, say so plainly and suggest the user upload the latest weekly report.

Be concise. Cite the disease and week when relevant. ${
    week ? `The latest published report is week ${week} of 2026.` : "No weekly report has been published yet."
  }`;

  const anthropic = createAnthropicProvider(apiKey);
  const model = anthropic(configuredModel());

  const tools = {
    getCasesByCounty: tool({
      description: "Get cases by county for a given disease for the latest published week.",
      inputSchema: z.object({ disease: diseaseSchema }),
      execute: async ({ disease }: { disease: Disease }) => getCasesByCounty(sb, reportId, disease, week),
    }),
    getTrend: tool({
      description: "Get the weekly case trend for a disease over the last N published weeks (default 6).",
      inputSchema: z.object({ disease: diseaseSchema, weeks: z.number().int().min(2).max(12).default(6) }),
      execute: async ({ disease, weeks }: { disease: Disease; weeks: number }) => getTrend(sb, disease, weeks),
    }),
    getMapHint: tool({
      description: "Return a map hint card pointing the user to the on-page map for a disease and area.",
      inputSchema: z.object({ disease: diseaseSchema, area: z.string().min(1).max(80) }),
      execute: async ({ disease, area }: { disease: Disease; area: string }) => getMapHint(disease, area),
    }),
  };

  const result = streamText({
    model,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    headers: corsHeaders,
    onFinish: async ({ messages: finalMessages }: { messages: UIMessage[] }) => {
      try {
        const existingIds = new Set(messages.map((m) => m.id));
        const newOnes = finalMessages.filter((m) => !existingIds.has(m.id));
        if (newOnes.length === 0) return;
        const rows = newOnes.map((m) => {
          const textPart = m.parts.find((p) => p.type === "text") as { type: "text"; text: string } | undefined;
          return {
            user_id: userId,
            role: m.role,
            content: textPart?.text ?? "",
            parts: JSON.parse(JSON.stringify(m.parts)),
            message_id: m.id,
          };
        });
        const { error } = await sb.from("chat_messages").insert(rows);
        if (error) console.error("chat persist error", error);
      } catch (err) {
        console.error("onFinish error", err);
      }
    },
  });
});
