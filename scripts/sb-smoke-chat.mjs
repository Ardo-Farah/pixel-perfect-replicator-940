import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
const url = get("VITE_SUPABASE_URL") || "https://xewepnpqhwxsqiqhbfyr.supabase.co";
const anon = get("VITE_SUPABASE_PUBLISHABLE_KEY");
const endpoint = `${url}/functions/v1/chat`;

// 1) CORS preflight
const opt = await fetch(endpoint, { method: "OPTIONS", headers: { "access-control-request-method": "POST" } });
console.log("OPTIONS status", opt.status, "| allow-origin:", opt.headers.get("access-control-allow-origin"));

// 2) POST with anon key as bearer (not a user JWT). Passes the gateway (valid
// project key) but the function's getUser() must reject it -> 401 from the body,
// which proves the function booted and the AI-SDK imports resolved.
const post = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${anon}` },
  body: JSON.stringify({ messages: [{ id: "1", role: "user", parts: [{ type: "text", text: "hi" }] }] }),
});
const body = await post.text();
console.log("POST status", post.status);
console.log("POST body:", body.slice(0, 300));
