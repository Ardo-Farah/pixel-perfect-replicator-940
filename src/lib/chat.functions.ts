import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getChatHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, parts, message_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) {
      console.error("getChatHistory error", error);
      return { messages: [] as ChatHistoryItem[] };
    }
    return {
      messages: (data ?? []).map((row) => ({
        id: row.message_id ?? row.id,
        role: row.role as "user" | "assistant",
        parts: Array.isArray(row.parts) && row.parts.length > 0
          ? (row.parts as unknown[])
          : [{ type: "text", text: row.content ?? "" }],
      })) as ChatHistoryItem[],
    };
  });

export const clearChatHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("chat_messages").delete().eq("user_id", userId);
    if (error) {
      console.error("clearChatHistory error", error);
      return { ok: false };
    }
    return { ok: true };
  });

export type ChatHistoryItem = {
  id: string;
  role: "user" | "assistant";
  parts: unknown[];
};
