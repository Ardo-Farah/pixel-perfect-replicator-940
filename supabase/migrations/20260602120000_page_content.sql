-- Editable per-page content for the admin "Page Content" section. The admin UI
-- (admin-content.functions.ts) reads/writes this via the service role; without
-- the table, edits silently fell back to defaults. Access is via service-role
-- server functions only, so RLS is enabled with no client policies.
CREATE TABLE IF NOT EXISTS public.page_content (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key    text NOT NULL,
  section_key text NOT NULL,
  field_key   text NOT NULL,
  value_text  text,
  value_number numeric,
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_key, section_key, field_key)
);

ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
