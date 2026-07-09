-- Evidence ledger for AI-assisted report ingestion.
-- Each row ties an extracted field/value back to the source text produced from
-- a PPTX/PDF/XLSX, so admins can review where key figures came from before
-- publishing a draft report.

CREATE TABLE IF NOT EXISTS public.report_extraction_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  field_path text NOT NULL,
  value_text text NOT NULL,
  numeric_value numeric,
  source_type text NOT NULL DEFAULT 'text',
  slide_number int,
  source_snippet text NOT NULL,
  confidence numeric(4,3) NOT NULL DEFAULT 0.700,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_extraction_evidence_report_idx
  ON public.report_extraction_evidence (report_id);

CREATE INDEX IF NOT EXISTS report_extraction_evidence_field_idx
  ON public.report_extraction_evidence (field_path);

GRANT SELECT ON public.report_extraction_evidence TO authenticated;
GRANT ALL ON public.report_extraction_evidence TO service_role;

ALTER TABLE public.report_extraction_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read extraction evidence" ON public.report_extraction_evidence;
CREATE POLICY "Authenticated read extraction evidence"
ON public.report_extraction_evidence
FOR SELECT TO authenticated
USING (true);
