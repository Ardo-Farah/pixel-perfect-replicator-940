// Server-only admin client for the external Supabase project.
// Uses the service role key — NEVER import this from client code.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.EXTERNAL_SUPABASE_URL ??
  "https://xewepnpqhwxsqiqhbfyr.supabase.co";

const SERVICE_ROLE_KEY = process.env.EXTERNAL_SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  // Soft warn at module load so missing-secret errors are obvious.
  console.warn(
    "[supabase-admin] EXTERNAL_SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "Add it via the secrets manager before using supabaseAdmin.",
  );
}

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY ?? "missing-service-role-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
