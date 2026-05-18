## Plan: Wire Profile page to live Supabase data

### 1. SQL migration (you run on external project `xewepnpqhwxsqiqhbfyr`)

I'll give you a SQL script to paste into the external project's SQL editor:

```sql
-- Extend profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS station text,
  ADD COLUMN IF NOT EXISTS staff_id text,
  ADD COLUMN IF NOT EXISTS assigned_counties text[] DEFAULT '{}';

-- RLS: users can read/update their own row (skip if already present)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles select own" ON public.profiles;
CREATE POLICY "Profiles select own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Profiles update own" ON public.profiles;
CREATE POLICY "Profiles update own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Profiles insert own" ON public.profiles;
CREATE POLICY "Profiles insert own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Ensure new auth users get a profiles row (if trigger missing)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

`audit_log` already exists per project-knowledge (`user_id`, `action`, `table_name`, `report_id`, `created_at`). No schema change needed there.

### 2. Frontend changes (only `src/routes/_authenticated/profile.tsx`)

No layout, class, or markup-structure changes — only data sources and the new dialog.

**Data loading (inside `ProfilePage`)**
- `useEffect` on mount: `supabase.auth.getUser()` → fetch profile row `from('profiles').select('*').eq('id', user.id).maybeSingle()` and audit rows `from('audit_log').select('action, table_name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)`.
- Local state: `profile`, `auditRows`, `loading`, `dialogOpen`.
- Helper `display(v)` → returns `v ?? <span className="italic text-on-surface-variant">Not set</span>`.
- Helper `relativeTime(iso)` → "10 mins ago" / "2 hours ago" / "Today, HH:mm" style.
- Avatar initials derived from `full_name` (fallback "—").
- Header name → `profile.full_name ?? "Not set"`; role line → `profile.role ?? "Not set"`.

**Field bindings (same JSX, same classes)**
- Personal Details: Full Name → `profile.full_name`; Official Email → `user.email` from auth (read-only, mailto link); Phone → `profile.phone`; Primary Station → `profile.station`.
- Professional Profile: Staff ID → `profile.staff_id`; Department → `profile.department`; Reports To stays static (not in scope). Access-level toggle stays local UI state.
- Regional Jurisdiction: render `profile.assigned_counties ?? []`. If empty, show one row "Not set".

**Recent Actions list**
- Map `auditRows` into the existing `<ol>` items. Title = `row.action`; description = `row.table_name ? \`on ${row.table_name}\` : ""`; time = `relativeTime(row.created_at)`; reuse the existing icon/color (default `history` + neutral chip — pick `update` icon, neutral `bg-surface-container` styling) to avoid styling changes.
- Empty state: one `<li>` "No recent activity".

**Edit Profile dialog**
- Replace the existing "Edit Profile" `<button>` `onClick` with `setDialogOpen(true)` — button styling unchanged.
- New shadcn `Dialog` (`@/components/ui/dialog`) mounted at the bottom of the page (outside layout flow, doesn't affect layout) with a `<form>` containing Inputs for: full_name, phone, role, department, station, staff_id, and assigned_counties (comma-separated text → split/trim into `text[]`).
- Save handler: `supabase.from('profiles').update({...}).eq('id', user.id)` → on success re-fetch profile and close dialog; toast via existing `sonner` if available, else silent.

### 3. What stays untouched
- All Tailwind classes, card structure, colors, header banner, security card, footer.
- 2FA / Login Notifications toggles, Change Password, Sign Out buttons, View Logs, View Interactive Map, Reports To — left as-is (out of scope).
- No other files modified.

### Deliverable order
1. SQL script (you run it on external project, confirm done).
2. I edit `src/routes/_authenticated/profile.tsx` only.
