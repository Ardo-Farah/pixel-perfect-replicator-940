ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER TABLE public.page_content REPLICA IDENTITY FULL;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['documents','page_content'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;