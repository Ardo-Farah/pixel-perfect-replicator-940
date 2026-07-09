-- Admin profile support.
-- Keeps billabiola@gmail.com as the first admin and lets admins manage roles.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'viewer';

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;

UPDATE public.profiles
SET role = 'admin'
WHERE lower(email) = 'billabiola@gmail.com';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    CASE WHEN lower(NEW.email) = 'billabiola@gmail.com' THEN 'admin' ELSE 'viewer' END
  )
  ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(public.profiles.email, EXCLUDED.email);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR lower(email) = 'billabiola@gmail.com'
      )
  );
$$;

DROP POLICY IF EXISTS "Profiles select all for admins" ON public.profiles;
CREATE POLICY "Profiles select all for admins"
ON public.profiles
FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Profiles update all for admins" ON public.profiles;
CREATE POLICY "Profiles update all for admins"
ON public.profiles
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
