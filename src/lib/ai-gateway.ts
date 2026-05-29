import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const createLovableAiGatewayProvider = (lovableApiKey: string) =>
  createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

// Anthropic (Claude) via its OpenAI-compatible endpoint, so we can reuse the
// already-installed openai-compatible provider (no extra dependency). Supports
// tool calling + streaming. Auth uses the standard bearer header.
export const createAnthropicProvider = (anthropicApiKey: string) =>
  createOpenAICompatible({
    name: "anthropic",
    baseURL: "https://api.anthropic.com/v1",
    headers: {
      Authorization: `Bearer ${anthropicApiKey}`,
    },
  });
