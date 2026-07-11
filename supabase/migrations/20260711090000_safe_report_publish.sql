-- Safe report replacement and draft visibility.
-- A processed upload creates a complete draft first. Publishing then atomically
-- switches the active report for that epidemiological week.

BEGIN;

ALTER TABLE public.weekly_reports
  ADD COLUMN IF NOT EXISTS source_storage_path text,
  ADD COLUMN IF NOT EXISTS source_sha256 text;

CREATE INDEX IF NOT EXISTS weekly_reports_source_sha256_idx
  ON public.weekly_reports (source_sha256)
  WHERE source_sha256 IS NOT NULL;
-- Existing data may contain more than one published row for a week. Preserve
-- the report already linked to a document; otherwise preserve the newest row.
WITH ranked_published AS (
  SELECT
    wr.id,
    row_number() OVER (
      PARTITION BY wr.week_number
      ORDER BY
        EXISTS (
          SELECT 1 FROM public.documents d WHERE d.report_id = wr.id
        ) DESC,
        wr.created_at DESC,
        wr.id DESC
    ) AS position
  FROM public.weekly_reports wr
  WHERE wr.published = true
)
UPDATE public.weekly_reports wr
SET published = false
FROM ranked_published ranked
WHERE wr.id = ranked.id AND ranked.position > 1;


CREATE UNIQUE INDEX IF NOT EXISTS weekly_reports_one_published_week_idx
  ON public.weekly_reports (week_number)
  WHERE published = true;

CREATE OR REPLACE FUNCTION public.can_read_report(_report_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1
        FROM public.weekly_reports wr
        WHERE wr.id = _report_id
          AND wr.published = true
      );
$$;

REVOKE EXECUTE ON FUNCTION public.can_read_report(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_report(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "reports_select" ON public.weekly_reports;
DROP POLICY IF EXISTS "read_published_or_admin" ON public.weekly_reports;
CREATE POLICY "read_published_or_admin"
  ON public.weekly_reports
  FOR SELECT TO authenticated
  USING (
    published = true
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DO $$
DECLARE
  table_name text;
  policy_name text;
  report_tables text[] := ARRAY[
    'report_summary',
    'mpox_data',
    'mpox_counties',
    'mpox_demographics',
    'measles_data',
    'measles_counties',
    'ebola_data',
    'cholera_data',
    'dengue_data',
    'idsr_data',
    'idsr_counties',
    'nutrition_data',
    'nutrition_counties',
    'weather_data',
    'report_visuals'
  ];
BEGIN
  FOREACH table_name IN ARRAY report_tables LOOP
    IF to_regclass('public.' || table_name) IS NULL THEN
      CONTINUE;
    END IF;

    FOR policy_name IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND cmd = 'SELECT'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY read_published_or_admin ON public.%I FOR SELECT TO authenticated USING (public.can_read_report(report_id))',
      table_name
    );
  END LOOP;
END
$$;

DROP POLICY IF EXISTS "Authenticated read extraction evidence" ON public.report_extraction_evidence;
DROP POLICY IF EXISTS "read_evidence_admin_only" ON public.report_extraction_evidence;
CREATE POLICY "read_evidence_admin_only"
  ON public.report_extraction_evidence
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authenticated view documents" ON public.documents;
DROP POLICY IF EXISTS "read_published_documents_or_admin" ON public.documents;
CREATE POLICY "read_published_documents_or_admin"
  ON public.documents
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (
      report_id IS NOT NULL
      AND public.can_read_report(report_id)
    )
  );

CREATE OR REPLACE FUNCTION public.publish_reviewed_report(
  _report_id uuid,
  _storage_path text,
  _caller_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_week int;
BEGIN
  IF NOT public.has_role(_caller_id, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin role required';
  END IF;

  SELECT week_number
  INTO report_week
  FROM public.weekly_reports
  WHERE id = _report_id
  FOR UPDATE;

  IF report_week IS NULL THEN
    RAISE EXCEPTION 'report not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.report_extraction_evidence
    WHERE report_id = _report_id
  ) THEN
    RAISE EXCEPTION 'report has no extraction evidence';
  END IF;

  UPDATE public.weekly_reports
  SET published = false
  WHERE week_number = report_week
    AND published = true
    AND id <> _report_id;

  UPDATE public.weekly_reports
  SET published = true
  WHERE id = _report_id;

  IF _storage_path <> '' THEN
    UPDATE public.documents
    SET report_id = _report_id,
        week_number = report_week
    WHERE storage_path = _storage_path;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'document not found';
    END IF;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.publish_reviewed_report(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_reviewed_report(uuid, text, uuid)
  TO service_role;

COMMIT;

