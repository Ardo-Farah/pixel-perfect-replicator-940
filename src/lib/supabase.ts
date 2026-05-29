import { createClient } from "@supabase/supabase-js";

// External Supabase project (separate from Lovable Cloud's internal project).
// The anon key is a publishable JWT — safe to inline in client code.
// Exported so server routes (e.g. /api/chat) can build a token-scoped client
// against the same external project without duplicating the publishable key.
export const SUPABASE_URL =
  (import.meta.env.VITE_EXTERNAL_SUPABASE_URL as string | undefined) ??
  "https://xewepnpqhwxsqiqhbfyr.supabase.co";

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld2VwbnBxaHd4c3FpcWhiZnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODg1MDQsImV4cCI6MjA5NDQ2NDUwNH0.rvCHSNvoFvE-b-TQp511FPUCkUk2mfZ0xFEEWygQI1w";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
