import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const token = (env.match(/^SUPABASE_ACCESS_TOKEN=(.*)$/m)?.[1] ?? "").trim().replace(/^["']|["']$/g, "");
if (!token) { console.error("no token"); process.exit(1); }

const ref = "xewepnpqhwxsqiqhbfyr";
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

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/functions/deploy?slug=${slug}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});
const text = await res.text();
console.log("status", res.status);
console.log(text.slice(0, 800));
