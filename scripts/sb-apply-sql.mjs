import { readFileSync } from "node:fs";

const REF = "xewepnpqhwxsqiqhbfyr";
const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/sb-apply-sql.mjs <sql-file>");

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const TOKEN = (env.match(/^SUPABASE_ACCESS_TOKEN=(.*)$/m)?.[1] ?? "")
  .trim()
  .replace(/^["']|["']$/g, "");
const sql = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

console.log("STATUS", res.status);
console.log((await res.text()).slice(0, 1000));
