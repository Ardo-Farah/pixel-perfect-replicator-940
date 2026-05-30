
CREATE TABLE public.page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  section_key text NOT NULL,
  field_key text NOT NULL,
  value_text text,
  value_number numeric,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_key, section_key, field_key)
);

CREATE INDEX page_content_page_idx ON public.page_content (page_key);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_content TO authenticated;
GRANT ALL ON public.page_content TO service_role;

ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read page content"
ON public.page_content FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins insert page content"
ON public.page_content FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update page content"
ON public.page_content FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete page content"
ON public.page_content FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
