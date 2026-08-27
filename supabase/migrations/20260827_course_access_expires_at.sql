-- ════════════════════════════════════════════════════════════════
-- MIGRATION — 2026-08-27
-- Add expires_at to course_access and pending_access, enforce NOT NULL,
-- and fix handle_new_user() so pending → course_access redemption
-- carries the expiry instead of dropping it (→ NULL = "never expires").
--
-- Context: `expires_at` was referenced by stripe-webhook.js,
-- js/tse-platform.js and download-pdf.js but was never in the tracked
-- schema. If it was added to the live DB by hand, `add column if not
-- exists` is a no-op and the migration just backfills + constrains.
--
-- Section order matters: the trigger (section 3) is fixed BEFORE the
-- NOT NULL constraint (section 4), so there is never a window where the
-- old expiry-dropping trigger runs against a NOT NULL column and breaks
-- sign-up. Deploy the updated stripe-webhook.js at or before this.
--
-- The original bad course_access row (Programme access / NULL expiry
-- from an untraced earlier checkout) was already deleted manually, so
-- section 2 has nothing anomalous to touch. If any unexpected NULL
-- remains, section 4 will fail loudly rather than silently constrain it.
-- ════════════════════════════════════════════════════════════════

-- ── 1. Add the columns (nullable for now) ───────────────────────
alter table public.course_access  add column if not exists expires_at timestamptz;
alter table public.pending_access add column if not exists expires_at timestamptz;

-- ── 2. Backfill any existing NULLs ─────────────────────────────
--    guide rows      → permanent sentinel 2099-01-01
--    programme rows  → granted_at/created_at + 6 months (best effort
--                      for legacy rows with no recorded expiry)

update public.course_access
   set expires_at = timestamptz '2099-01-01 00:00:00+00'
 where expires_at is null
   and course_id = '9bbe3f5f-a1c9-4646-a63a-6f15b1edcf12';

update public.course_access
   set expires_at = coalesce(granted_at, now()) + interval '6 months'
 where expires_at is null;

update public.pending_access
   set expires_at = timestamptz '2099-01-01 00:00:00+00'
 where expires_at is null
   and course_id = '9bbe3f5f-a1c9-4646-a63a-6f15b1edcf12';

update public.pending_access
   set expires_at = coalesce(created_at, now()) + interval '6 months'
 where expires_at is null;

-- ── 3. Fix the sign-up redemption trigger ─────────────────────
--    Carry pa.expires_at through instead of dropping it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student'
  );

  insert into public.course_access (user_id, course_id, granted_at, expires_at, stripe_session_id)
  select new.id, pa.course_id, now(), pa.expires_at, pa.stripe_session_id
  from   public.pending_access pa
  where  lower(pa.email) = lower(new.email)
  on conflict (user_id, course_id) do nothing;

  delete from public.pending_access
  where lower(email) = lower(new.email);

  return new;
end;
$$;

-- ── 4. Enforce NOT NULL ───────────────────────────────────────
alter table public.course_access  alter column expires_at set not null;
alter table public.pending_access alter column expires_at set not null;
