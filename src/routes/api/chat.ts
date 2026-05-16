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
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createClient } from "@supabase/supabase-js";
import {
  getCasesByCounty,
  getDeathsByRegion,
  getMapHint,
  getTrend,
  type Disease,
} from "@/lib/idsr-data";

const diseaseSchema = z.enum(["mpox", "measles", "anthrax", "floods", "nutrition"]);

const SYSTEM_PROMPT = `You are the WHO Kenya Health Emergencies AI assistant.
You help health officials explore IDSR surveillance data for Mpox, Measles, Anthrax, Floods, and Nutrition in Kenya.

When the user asks for breakdowns by county, trends, regional deaths, or maps, ALWAYS call the appropriate tool to fetch the data; the UI will render an inline chart widget from the tool result. After calling a tool, write one short sentence summarizing the insight — do not repeat the numbers, the widget shows them.

Be concise. Cite the disease and week when relevant. Today is week 18 of 2026.`;

async function getUserId(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const userId = await getUserId(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const body = (await request.json()) as { messages?: UIMessage[] };
        const messages = body.messages ?? [];
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("messages required", { status: 400 });
        }

        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway("google/gemini-3-flash-preview");

        const tools = {
          getCasesByCounty: tool({
            description: "Get new cases by county for a given disease for the current week.",
            inputSchema: z.object({ disease: diseaseSchema }),
            execute: async ({ disease }) => getCasesByCounty(disease as Disease),
          }),
          getTrend: tool({
            description: "Get weekly case trend for a disease for the last N weeks (default 6).",
            inputSchema: z.object({ disease: diseaseSchema, weeks: z.number().int().min(2).max(12).default(6) }),
            execute: async ({ disease, weeks }) => getTrend(disease as Disease, weeks),
          }),
          getDeathsByRegion: tool({
            description: "Get reported deaths by region for a disease this week (use for flood deaths).",
            inputSchema: z.object({ disease: diseaseSchema }),
            execute: async ({ disease }) => getDeathsByRegion(disease as Disease),
          }),
          getMapHint: tool({
            description: "Return a map hint card pointing the user to the on-page map for a disease and area.",
            inputSchema: z.object({ disease: diseaseSchema, area: z.string().min(1).max(80) }),
            execute: async ({ disease, area }) => getMapHint(disease as Disease, area),
          }),
        };

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: convertToModelMessages(messages),
          tools,
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            try {
              // Persist only the newly added messages by id diff
              const existingIds = new Set(messages.map((m) => m.id));
              const newOnes = finalMessages.filter((m) => !existingIds.has(m.id));
              if (newOnes.length === 0) return;
              const rows = newOnes.map((m) => {
                const textPart = m.parts.find((p) => p.type === "text") as { type: "text"; text: string } | undefined;
                return {
                  user_id: userId,
                  role: m.role,
                  content: textPart?.text ?? "",
                  parts: m.parts as unknown as object,
                  message_id: m.id,
                };
              });
              const { error } = await supabaseAdmin.from("chat_messages").insert(rows);
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
