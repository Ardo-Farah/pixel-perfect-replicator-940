import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import {
  convertToModelMessages,
  streamText,
  tool,
  stepCountIs,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { createAnthropicProvider } from "@/lib/ai-gateway";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import {
  getCasesByCounty,
  getDeathsByRegion,
  getLatestReport,
  getMapHint,
  getTrend,
  type Disease,
} from "@/lib/idsr-data";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const diseaseSchema = z.enum(["mpox", "measles", "anthrax", "floods", "nutrition"]);

// Token-scoped client against the external project: validates the user's JWT
// and reads/writes under their RLS (no service-role key needed).
function authedClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);
        const sb = authedClient(token);

        const { data: userData, error: userErr } = await sb.auth.getUser();
        if (userErr || !userData?.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) return new Response("Missing ANTHROPIC_API_KEY", { status: 500 });

        const body = (await request.json()) as { messages?: UIMessage[] };
        const messages = body.messages ?? [];
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("messages required", { status: 400 });
        }

        // Tools answer about the latest published weekly report.
        const latest = await getLatestReport(sb);
        const reportId = latest?.id ?? null;
        const week = latest?.week_number ?? null;

        const systemPrompt = `You are the Updates AI assistant.
You help health officials explore IDSR surveillance data for Mpox, Measles, Anthrax, Floods, and Nutrition in Kenya.

When the user asks for breakdowns by county, trends, regional deaths, or maps, ALWAYS call the appropriate tool to fetch the data; the UI will render an inline chart widget from the tool result. After calling a tool, write one short sentence summarizing the insight — do not repeat the numbers, the widget shows them. If a tool returns no items, say so plainly and suggest the user upload the latest weekly report.

Be concise. Cite the disease and week when relevant. ${
          week ? `The latest published report is week ${week} of 2026.` : "No weekly report has been published yet."
        }`;

        const anthropic = createAnthropicProvider(apiKey);
        const model = anthropic(process.env.ANTHROPIC_MODEL || DEFAULT_MODEL);

        const tools = {
          getCasesByCounty: tool({
            description: "Get cases by county for a given disease for the latest published week.",
            inputSchema: z.object({ disease: diseaseSchema }),
            execute: async ({ disease }) => getCasesByCounty(sb, reportId, disease as Disease, week),
          }),
          getTrend: tool({
            description: "Get the weekly case trend for a disease over the last N published weeks (default 6).",
            inputSchema: z.object({
              disease: diseaseSchema,
              weeks: z.number().int().min(2).max(12).default(6),
            }),
            execute: async ({ disease, weeks }) => getTrend(sb, disease as Disease, weeks),
          }),
          getDeathsByRegion: tool({
            description: "Get reported deaths by region for a disease this week (use for flood deaths).",
            inputSchema: z.object({ disease: diseaseSchema }),
            execute: async ({ disease }) => getDeathsByRegion(sb, reportId, disease as Disease, week),
          }),
          getMapHint: tool({
            description: "Return a map hint card pointing the user to the on-page map for a disease and area.",
            inputSchema: z.object({ disease: diseaseSchema, area: z.string().min(1).max(80) }),
            execute: async ({ disease, area }) => getMapHint(disease as Disease, area),
          }),
        };

        const result = streamText({
          model,
          system: systemPrompt,
          messages: await convertToModelMessages(messages),
          tools,
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            try {
              // Persist only the newly added messages by id diff.
              const existingIds = new Set(messages.map((m) => m.id));
              const newOnes = finalMessages.filter((m) => !existingIds.has(m.id));
              if (newOnes.length === 0) return;
              const rows = newOnes.map((m) => {
                const textPart = m.parts.find((p) => p.type === "text") as
                  | { type: "text"; text: string }
                  | undefined;
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
      },
    },
  },
});
