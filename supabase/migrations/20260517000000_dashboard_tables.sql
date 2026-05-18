-- ============================================================
-- WHO Kenya Health Emergency Dashboard — full schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Profiles & auth (already in earlier migration, skip if exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Master report table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INT NOT NULL,
  reporting_date DATE NOT NULL,
  published   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_select" ON public.weekly_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "reports_insert" ON public.weekly_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "reports_update" ON public.weekly_reports FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- Report summary (one row per report)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_summary (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id    UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  new_events   INT NOT NULL DEFAULT 0,
  outbreaks    INT NOT NULL DEFAULT 0,
  grade_1      INT NOT NULL DEFAULT 0,
  grade_2      INT NOT NULL DEFAULT 0,
  grade_3      INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.report_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "summary_select" ON public.report_summary FOR SELECT TO authenticated USING (true);
CREATE POLICY "summary_insert" ON public.report_summary FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- Mpox
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpox_data (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id             UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  cumulative_cases      INT NOT NULL DEFAULT 0,
  new_cases_this_week   INT NOT NULL DEFAULT 0,
  deaths                INT NOT NULL DEFAULT 0,
  cfr                   NUMERIC(5,2) NOT NULL DEFAULT 0,
  counties_affected     INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mpox_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mpox_data_select" ON public.mpox_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "mpox_data_insert" ON public.mpox_data FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.mpox_counties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  county_name TEXT NOT NULL,
  cases_2026  INT NOT NULL DEFAULT 0,
  is_hotspot  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mpox_counties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mpox_counties_select" ON public.mpox_counties FOR SELECT TO authenticated USING (true);
CREATE POLICY "mpox_counties_insert" ON public.mpox_counties FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.mpox_demographics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  age_group   TEXT,
  sex         TEXT,
  occupation  TEXT,
  case_count  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mpox_demographics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mpox_demo_select" ON public.mpox_demographics FOR SELECT TO authenticated USING (true);
CREATE POLICY "mpox_demo_insert" ON public.mpox_demographics FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- Measles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.measles_data (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  total_cases       INT NOT NULL DEFAULT 0,
  confirmed         INT NOT NULL DEFAULT 0,
  suspected         INT NOT NULL DEFAULT 0,
  counties_affected INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.measles_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "measles_data_select" ON public.measles_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "measles_data_insert" ON public.measles_data FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.measles_counties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  county_name TEXT NOT NULL,
  sub_county  TEXT,
  case_count  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.measles_counties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "measles_counties_select" ON public.measles_counties FOR SELECT TO authenticated USING (true);
CREATE POLICY "measles_counties_insert" ON public.measles_counties FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- Anthrax
-- ============================================================
CREATE TABLE IF NOT EXISTS public.anthrax_data (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id      UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  county         TEXT NOT NULL,
  sub_county     TEXT,
  human_cases    INT NOT NULL DEFAULT 0,
  human_deaths   INT NOT NULL DEFAULT 0,
  animal_deaths  INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.anthrax_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anthrax_select" ON public.anthrax_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "anthrax_insert" ON public.anthrax_data FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- Floods
-- ============================================================
CREATE TABLE IF NOT EXISTS public.floods_data (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id           UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  counties_affected   INT NOT NULL DEFAULT 0,
  total_deaths        INT NOT NULL DEFAULT 0,
  missing_persons     INT NOT NULL DEFAULT 0,
  coast_deaths        INT NOT NULL DEFAULT 0,
  eastern_deaths      INT NOT NULL DEFAULT 0,
  nyanza_deaths       INT NOT NULL DEFAULT 0,
  rift_valley_deaths  INT NOT NULL DEFAULT 0,
  western_deaths      INT NOT NULL DEFAULT 0,
  nairobi_deaths      INT NOT NULL DEFAULT 0,
  north_eastern_deaths INT NOT NULL DEFAULT 0,
  central_deaths      INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.floods_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "floods_select" ON public.floods_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "floods_insert" ON public.floods_data FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- IDSR
-- ============================================================
CREATE TABLE IF NOT EXISTS public.idsr_data (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id               UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  completeness_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,
  timeliness_pct          NUMERIC(5,2) NOT NULL DEFAULT 0,
  cebs_community_signals  INT NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.idsr_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idsr_data_select" ON public.idsr_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "idsr_data_insert" ON public.idsr_data FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.idsr_counties (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  county_name       TEXT NOT NULL,
  completeness_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,
  timeliness_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  below_threshold   BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.idsr_counties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idsr_counties_select" ON public.idsr_counties FOR SELECT TO authenticated USING (true);
CREATE POLICY "idsr_counties_insert" ON public.idsr_counties FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- Nutrition
-- ============================================================
CREATE TABLE IF NOT EXISTS public.nutrition_data (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id      UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  phase3_above   INT NOT NULL DEFAULT 0,
  phase4_5       INT NOT NULL DEFAULT 0,
  ipc_notes      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nutrition_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nutrition_data_select" ON public.nutrition_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "nutrition_data_insert" ON public.nutrition_data FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.nutrition_counties (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id           UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  county_name         TEXT NOT NULL,
  ipc_phase           INT NOT NULL DEFAULT 0,
  projected_phase     INT,
  population_affected INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nutrition_counties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nutrition_counties_select" ON public.nutrition_counties FOR SELECT TO authenticated USING (true);
CREATE POLICY "nutrition_counties_insert" ON public.nutrition_counties FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- Weather
-- ============================================================
CREATE TABLE IF NOT EXISTS public.weather_data (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id      UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  region         TEXT NOT NULL,
  max_temp_c     NUMERIC(4,1),
  min_temp_c     NUMERIC(4,1),
  rainfall_onset TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weather_select" ON public.weather_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "weather_insert" ON public.weather_data FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- Audit log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  table_name TEXT NOT NULL,
  report_id  UUID REFERENCES public.weekly_reports(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select" ON public.audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit_insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- Chat messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content    TEXT NOT NULL DEFAULT '',
  parts      JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_user_created_idx ON public.chat_messages (user_id, created_at);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_select" ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chat_insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_update" ON public.chat_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chat_delete" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
