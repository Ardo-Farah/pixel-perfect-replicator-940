// Deploy a Supabase Edge Function by slug via the Management API.
// Usage: node scripts/sb-deploy-fn.mjs <slug>
import { readFileSync } from "node:fs";
import { accessToken, projectRef } from "./supabase-project.mjs";

const slug = process.argv[2];
if (!slug) throw new Error("usage: node scripts/sb-deploy-fn.mjs <slug>");

if (!accessToken) throw new Error("Missing SUPABASE_ACCESS_TOKEN");
const code = readFileSync(new URL(`../supabase/functions/${slug}/index.ts`, import.meta.url), "utf8");

const form = new FormData();
form.append(
  "metadata",
  new Blob([JSON.stringify({ entrypoint_path: "index.ts", name: slug, verify_jwt: true })], { type: "application/json" }),
);
form.append("file", new Blob([code], { type: "application/typescript" }), "index.ts");

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions/deploy?slug=${slug}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${accessToken}` },
  body: form,
});
console.log("STATUS", res.status);
console.log((await res.text()).slice(0, 500));
