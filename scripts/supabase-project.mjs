import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");

export function envValue(name) {
  return (env.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1] ?? "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

export const supabaseUrl = envValue("VITE_SUPABASE_URL") || envValue("SUPABASE_URL");
export const projectRef =
  envValue("SUPABASE_PROJECT_REF") ||
  envValue("VITE_SUPABASE_PROJECT_ID") ||
  supabaseUrl.match(/^https:\/\/([a-z0-9]+)\.supabase\.co$/)?.[1] ||
  "";
export const accessToken = envValue("SUPABASE_ACCESS_TOKEN");

if (!projectRef) {
  throw new Error("Missing SUPABASE_PROJECT_REF (or a Supabase URL containing the project ref).");
}

