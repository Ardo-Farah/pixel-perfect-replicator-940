-- Enable Supabase Realtime for audit_log so the Profile page can subscribe
-- to INSERT events. Without membership in the supabase_realtime publication,
-- postgres_changes subscriptions succeed but never deliver events.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'audit_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;
  END IF;
END $$;
