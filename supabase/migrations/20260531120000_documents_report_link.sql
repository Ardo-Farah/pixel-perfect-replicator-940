-- Link each library document to the weekly_report it produces, and let any
-- authenticated user read document metadata (names/dates) so the header
-- document-selector dropdown works for viewers, not just admins.
-- Writes to documents remain admin-only.

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS report_id uuid REFERENCES public.weekly_reports(id) ON DELETE SET NULL;

-- Replace the admin-only SELECT with an authenticated read (metadata only).
DROP POLICY IF EXISTS "Admins view documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated view documents" ON public.documents;
CREATE POLICY "Authenticated view documents"
  ON public.documents
  FOR SELECT TO authenticated
  USING (true);
