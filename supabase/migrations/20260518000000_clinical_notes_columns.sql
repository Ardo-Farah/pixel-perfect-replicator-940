-- ============================================================
-- DB-backed clinical / narrative notes for disease pages
-- Nullable TEXT (no default) — NULL means "no note for this report"
-- ============================================================

ALTER TABLE public.measles_data
  ADD COLUMN IF NOT EXISTS clinical_notes          TEXT,
  ADD COLUMN IF NOT EXISTS epidemiological_summary TEXT,
  ADD COLUMN IF NOT EXISTS laboratory_status       TEXT,
  ADD COLUMN IF NOT EXISTS strategic_updates       TEXT;

ALTER TABLE public.anthrax_data
  ADD COLUMN IF NOT EXISTS response_updates TEXT,
  ADD COLUMN IF NOT EXISTS prompt_action    TEXT;

ALTER TABLE public.floods_data
  ADD COLUMN IF NOT EXISTS health_facility_status TEXT,
  ADD COLUMN IF NOT EXISTS supplies_logistics     TEXT,
  ADD COLUMN IF NOT EXISTS epidemiological_risks  TEXT,
  ADD COLUMN IF NOT EXISTS prompt_action          TEXT;
