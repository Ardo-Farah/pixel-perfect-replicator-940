-- The safe replacement flow must be able to create a draft for the same
-- week/date while the currently published report remains available.
-- Publication uniqueness is enforced separately by
-- weekly_reports_one_published_week_idx.

ALTER TABLE public.weekly_reports
  DROP CONSTRAINT IF EXISTS weekly_reports_week_number_reporting_date_key;

