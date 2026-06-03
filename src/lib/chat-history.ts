// Chat history read/clear via the normal Supabase client. chat_messages is RLS
// per-user (auth.uid() = user_id), so this runs under the signed-in user with
// no service role and no app-host secret.
import { supabase } from "@/lib/supabase";

type JsonValue = string | number | boolean | null | { [k: string]: JsonValue } | JsonValue[];
export type ChatHistoryItem = {
  id: string;
  role: string;
  parts: JsonValue[];
};

export async function getChatHistory(_?: unknown): Promise<{ messages: ChatHistoryItem[] }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { messages: [] };

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, parts, message_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) {
    console.error("getChatHistory error", error);
    return { messages: [] };
  }
  const messages = (data ?? []).map((row: {
    id: string;
    role: string;
    content: string | null;
    parts: JsonValue[] | null;
    message_id: string | null;
  }) => ({
    id: row.message_id ?? row.id,
    role: row.role,
    parts:
      Array.isArray(row.parts) && row.parts.length > 0
        ? row.parts
        : [{ type: "text", text: row.content ?? "" }],
  }));
  return { messages: JSON.parse(JSON.stringify(messages)) as ChatHistoryItem[] };
}

export async function clearChatHistory(_?: unknown): Promise<{ ok: boolean }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false };
  const { error } = await supabase.from("chat_messages").delete().eq("user_id", userId);
  if (error) {
    console.error("clearChatHistory error", error);
    return { ok: false };
  }
  return { ok: true };
}
