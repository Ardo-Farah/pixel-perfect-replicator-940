import { readFileSync } from "node:fs";
import { accessToken, projectRef } from "./supabase-project.mjs";

if (!accessToken) throw new Error("Missing SUPABASE_ACCESS_TOKEN");
const slug = "chat";
const source = readFileSync(new URL("../supabase/functions/chat/index.ts", import.meta.url), "utf8");

const form = new FormData();
form.append(
  "metadata",
  new Blob([JSON.stringify({ entrypoint_path: "index.ts", name: slug, verify_jwt: true })], {
    type: "application/json",
  }),
);
form.append("file", new Blob([source], { type: "application/typescript" }), "index.ts");

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions/deploy?slug=${slug}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${accessToken}` },
  body: form,
});
const text = await res.text();
console.log("status", res.status);
console.log(text.slice(0, 800));
