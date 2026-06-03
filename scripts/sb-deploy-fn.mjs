// Deploy a Supabase Edge Function by slug via the Management API.
// Usage: node scripts/sb-deploy-fn.mjs <slug>
import { readFileSync } from "node:fs";

const REF = "xewepnpqhwxsqiqhbfyr";
const slug = process.argv[2];
if (!slug) throw new Error("usage: node scripts/sb-deploy-fn.mjs <slug>");

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const TOKEN = (env.match(/^SUPABASE_ACCESS_TOKEN=(.*)$/m)?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
const code = readFileSync(new URL(`../supabase/functions/${slug}/index.ts`, import.meta.url), "utf8");

const form = new FormData();
form.append(
  "metadata",
  new Blob([JSON.stringify({ entrypoint_path: "index.ts", name: slug, verify_jwt: true })], { type: "application/json" }),
);
form.append("file", new Blob([code], { type: "application/typescript" }), "index.ts");

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/functions/deploy?slug=${slug}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}` },
  body: form,
});
console.log("STATUS", res.status);
console.log((await res.text()).slice(0, 500));
