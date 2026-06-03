import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const token = (env.match(/^SUPABASE_ACCESS_TOKEN=(.*)$/m)?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
if (!token) { console.error("no token"); process.exit(1); }

const ref = "xewepnpqhwxsqiqhbfyr";
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/secrets`, {
  headers: { Authorization: `Bearer ${token}` },
});
const body = await res.json();
const names = Array.isArray(body) ? body.map((s) => s.name).sort() : body;
console.log("status", res.status);
console.log(JSON.stringify(names, null, 2));
