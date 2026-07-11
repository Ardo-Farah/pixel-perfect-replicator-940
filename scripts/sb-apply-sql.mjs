import { readFileSync } from "node:fs";
import { accessToken, projectRef } from "./supabase-project.mjs";

const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/sb-apply-sql.mjs <sql-file>");

if (!accessToken) throw new Error("Missing SUPABASE_ACCESS_TOKEN");
const sql = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

console.log("STATUS", res.status);
console.log((await res.text()).slice(0, 1000));
