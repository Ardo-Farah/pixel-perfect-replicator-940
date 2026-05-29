-- Security lockdown (applied 2026-05-29 via Supabase Management API).
-- Goal: surveillance data is written only by process-upload (service_role, which
-- bypasses RLS) and, for weekly_reports, by admins via the UI. Any authenticated
-- user could previously insert/update/delete every table because of the permissive
-- "auth_write" (FOR ALL) and "*_insert" (WITH CHECK true) policies. audit_log was
-- also world-readable/writable. Authenticated SELECT on data tables is preserved
-- so the dashboard keeps working.

BEGIN;

-- 1. Child/disease tables: remove all authenticated write access.
DROP POLICY IF EXISTS "auth_write" ON public.report_summary;
DROP POLICY IF EXISTS "summary_insert" ON public.report_summary;

DROP POLICY IF EXISTS "auth_write" ON public.mpox_data;
DROP POLICY IF EXISTS "mpox_data_insert" ON public.mpox_data;

DROP POLICY IF EXISTS "auth_write" ON public.mpox_counties;
DROP POLICY IF EXISTS "mpox_counties_insert" ON public.mpox_counties;

DROP POLICY IF EXISTS "auth_write" ON public.mpox_demographics;
DROP POLICY IF EXISTS "mpox_demo_insert" ON public.mpox_demographics;

DROP POLICY IF EXISTS "auth_write" ON public.measles_data;
DROP POLICY IF EXISTS "measles_data_insert" ON public.measles_data;

DROP POLICY IF EXISTS "auth_write" ON public.measles_counties;
DROP POLICY IF EXISTS "measles_counties_insert" ON public.measles_counties;

DROP POLICY IF EXISTS "auth_write" ON public.anthrax_data;
DROP POLICY IF EXISTS "anthrax_insert" ON public.anthrax_data;

DROP POLICY IF EXISTS "auth_write" ON public.floods_data;
DROP POLICY IF EXISTS "floods_insert" ON public.floods_data;

DROP POLICY IF EXISTS "auth_write" ON public.idsr_data;
DROP POLICY IF EXISTS "idsr_data_insert" ON public.idsr_data;

DROP POLICY IF EXISTS "auth_write" ON public.idsr_counties;
DROP POLICY IF EXISTS "idsr_counties_insert" ON public.idsr_counties;

DROP POLICY IF EXISTS "auth_write" ON public.nutrition_data;
DROP POLICY IF EXISTS "nutrition_data_insert" ON public.nutrition_data;

DROP POLICY IF EXISTS "auth_write" ON public.nutrition_counties;
DROP POLICY IF EXISTS "nutrition_counties_insert" ON public.nutrition_counties;

DROP POLICY IF EXISTS "auth_write" ON public.weather_data;
DROP POLICY IF EXISTS "weather_insert" ON public.weather_data;

-- 2. weekly_reports: admins manage (publish/delete via UI); service_role inserts
--    via process-upload. Authenticated SELECT preserved.
DROP POLICY IF EXISTS "auth_write" ON public.weekly_reports;
DROP POLICY IF EXISTS "reports_insert" ON public.weekly_reports;
DROP POLICY IF EXISTS "reports_update" ON public.weekly_reports;
DROP POLICY IF EXISTS "reports_admin_write" ON public.weekly_reports;
CREATE POLICY "reports_admin_write" ON public.weekly_reports
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. audit_log: admins read; users insert only their own rows. Drop the
--    permissive policies that defeated that intent. The two desired policies
--    ("Authenticated insert audit", "Admins view audit log") are left in place.
DROP POLICY IF EXISTS "auth_write" ON public.audit_log;
DROP POLICY IF EXISTS "auth_read" ON public.audit_log;
DROP POLICY IF EXISTS "audit_insert" ON public.audit_log;
DROP POLICY IF EXISTS "audit_select" ON public.audit_log;

-- 4. Unify the admin model: is_admin() also honors user_roles via has_role(),
--    so admins granted through the UI satisfy the profiles admin policies.
--    Union form keeps any existing profiles.role/email admins too.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND (role = 'admin' OR lower(email) = 'billabiola@gmail.com')
      );
$$;

COMMIT;
