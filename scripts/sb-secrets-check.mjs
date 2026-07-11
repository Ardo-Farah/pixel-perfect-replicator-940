import { accessToken, projectRef } from "./supabase-project.mjs";

if (!accessToken) throw new Error("Missing SUPABASE_ACCESS_TOKEN");
const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/secrets`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const body = await res.json();
const names = Array.isArray(body) ? body.map((s) => s.name).sort() : body;
console.log("status", res.status);
console.log(JSON.stringify(names, null, 2));
