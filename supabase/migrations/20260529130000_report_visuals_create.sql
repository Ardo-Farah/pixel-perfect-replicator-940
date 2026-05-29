-- Create report_visuals (applied 2026-05-29 via Supabase Management API).
-- The original 20260523000000_report_visuals.sql was never applied to the live DB,
-- yet useReport.ts (useReportVisuals) and process-upload (ARRAY_TABLES) read/write
-- it. Shape matches that migration; RLS follows the new lockdown model — authenticated
-- SELECT only, writes go through process-upload's service role (bypasses RLS).

CREATE TABLE IF NOT EXISTS public.report_visuals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id    UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  disease      TEXT NOT NULL,
  section_key  TEXT NOT NULL,
  title        TEXT NOT NULL,
  visual_type  TEXT NOT NULL CHECK (visual_type IN ('bar', 'stacked_bar', 'line', 'pie', 'map', 'notes', 'table')),
  data         JSONB NOT NULL DEFAULT '[]'::jsonb,
  narrative    TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (report_id, disease, section_key)
);

CREATE INDEX IF NOT EXISTS report_visuals_report_disease_idx
  ON public.report_visuals (report_id, disease, created_at);

GRANT SELECT ON public.report_visuals TO authenticated;
GRANT ALL ON public.report_visuals TO service_role;

ALTER TABLE public.report_visuals ENABLE ROW LEVEL SECURITY;

-- Authenticated users read; no authenticated write policy (service role writes it).
DROP POLICY IF EXISTS "report_visuals_select" ON public.report_visuals;
CREATE POLICY "report_visuals_select"
  ON public.report_visuals
  FOR SELECT TO authenticated
  USING (true);
