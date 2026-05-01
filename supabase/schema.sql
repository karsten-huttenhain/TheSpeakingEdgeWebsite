-- ════════════════════════════════════════════════════════════════
-- THE SPEAKING EDGE — Supabase Schema
-- Paste the entire contents of this file into the Supabase
-- SQL Editor and click Run. Do this once on a fresh project.
-- ════════════════════════════════════════════════════════════════


-- ── 1. PROFILES ──────────────────────────────────────────────────
-- One row per auth user, created automatically on sign-up.

create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  full_name  text,
  role       text not null default 'student'
               check (role in ('student', 'trainer', 'admin')),
  created_at timestamptz default now()
);


-- ── 2. COURSES ───────────────────────────────────────────────────
-- One row for the Speaking Confidence Programme.
-- The UUID it gets here is what goes into TSE_CONFIG.courseId.

create table public.courses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz default now()
);

insert into public.courses (name, description)
values (
  'Speaking Confidence Programme',
  'Six-module programme: W.A.R.M.U.P. · S.C.R.I.B.E. · P.H.Y.S.C.L. · V.O.I.C.E.S. · R.A.I.N.B.O.W.S. · I.M.P.A.C.T. T.H.E.M.'
);


-- ── 3. COURSE ACCESS ─────────────────────────────────────────────
-- Granted by the Stripe webhook after payment.

create table public.course_access (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles on delete cascade,
  course_id         uuid not null references public.courses  on delete cascade,
  granted_at        timestamptz default now(),
  stripe_session_id text,
  unique (user_id, course_id)
);


-- ── 4. PENDING ACCESS ────────────────────────────────────────────
-- Holds access grants for buyers who haven't created an account yet.
-- Redeemed automatically when they sign up (see trigger below).

create table public.pending_access (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  course_id         uuid not null references public.courses on delete cascade,
  stripe_session_id text,
  created_at        timestamptz default now(),
  unique (email, course_id)
);


-- ── 5. PROGRESS ──────────────────────────────────────────────────

create table public.progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles on delete cascade,
  course_id    uuid not null references public.courses  on delete cascade,
  module_id    text not null,
  status       text not null default 'in_progress'
                 check (status in ('in_progress', 'complete')),
  completed_at timestamptz,
  updated_at   timestamptz default now(),
  unique (user_id, course_id, module_id)
);


-- ── 6. JOURNAL ENTRIES ───────────────────────────────────────────
-- Strictly private — only the student can ever read their own entries.

create table public.journal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles on delete cascade,
  course_id  uuid not null references public.courses  on delete cascade,
  module_id  text not null,
  content    text not null default '',
  updated_at timestamptz default now(),
  unique (user_id, course_id, module_id)
);


-- ── 7. SUBMISSIONS ───────────────────────────────────────────────

create table public.submissions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles on delete cascade,
  course_id  uuid not null references public.courses  on delete cascade,
  module_id  text not null,
  file_url   text not null,
  file_type  text,
  created_at timestamptz default now()
);


-- ════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════

alter table public.profiles        enable row level security;
alter table public.courses         enable row level security;
alter table public.course_access   enable row level security;
alter table public.pending_access  enable row level security;
alter table public.progress        enable row level security;
alter table public.journal_entries enable row level security;
alter table public.submissions     enable row level security;

-- profiles
create policy "profiles: own read"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles: own update"
  on public.profiles for update using (auth.uid() = id);

-- courses: any signed-in user can read
create policy "courses: authenticated read"
  on public.courses for select using (auth.role() = 'authenticated');

-- course_access: students see only their own row
create policy "course_access: own read"
  on public.course_access for select using (auth.uid() = user_id);

-- progress
create policy "progress: own read"
  on public.progress for select using (auth.uid() = user_id);
create policy "progress: own insert"
  on public.progress for insert with check (auth.uid() = user_id);
create policy "progress: own update"
  on public.progress for update using (auth.uid() = user_id);

-- journal_entries — no trainer/admin read, ever
create policy "journals: own read"
  on public.journal_entries for select using (auth.uid() = user_id);
create policy "journals: own insert"
  on public.journal_entries for insert with check (auth.uid() = user_id);
create policy "journals: own update"
  on public.journal_entries for update using (auth.uid() = user_id);

-- submissions
create policy "submissions: own read"
  on public.submissions for select using (auth.uid() = user_id);
create policy "submissions: own insert"
  on public.submissions for insert with check (auth.uid() = user_id);

-- pending_access: no direct user access (service role only, via webhook)


-- ════════════════════════════════════════════════════════════════
-- TRIGGER: auto-create profile and redeem pending access on sign-up
-- ════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Create the profile row from sign-up metadata
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student'
  );

  -- Redeem any course access purchased before sign-up
  insert into public.course_access (user_id, course_id, granted_at, stripe_session_id)
  select new.id, pa.course_id, now(), pa.stripe_session_id
  from   public.pending_access pa
  where  lower(pa.email) = lower(new.email)
  on conflict (user_id, course_id) do nothing;

  delete from public.pending_access
  where lower(email) = lower(new.email);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ════════════════════════════════════════════════════════════════
-- STORAGE POLICIES
-- Run this section AFTER creating the storage bucket manually:
--   Dashboard → Storage → New bucket
--   Name: participant-submissions
--   Public: OFF (leave toggled off)
-- ════════════════════════════════════════════════════════════════

-- Path structure: {course_id}/{user_id}/{module_id}/{timestamp}.{ext}
-- Users may only upload and read files inside their own user_id folder.

create policy "storage: own upload"
  on storage.objects for insert
  with check (
    bucket_id = 'participant-submissions'
    and auth.uid()::text = (string_to_array(name, '/'))[2]
  );

create policy "storage: own read"
  on storage.objects for select
  using (
    bucket_id = 'participant-submissions'
    and auth.uid()::text = (string_to_array(name, '/'))[2]
  );


-- ════════════════════════════════════════════════════════════════
-- MODULES TABLE
-- Run this after the initial schema to enable database-driven modules.
-- ════════════════════════════════════════════════════════════════

create table public.modules (
  id                  uuid primary key default gen_random_uuid(),
  course_id           uuid not null references public.courses on delete cascade,
  slug                text not null,
  module_number       int  not null,
  acronym             text not null,
  theme               text not null,
  title               text not null,
  color               text not null default '#C8392B',
  is_free             boolean not null default false,
  about_text          text,
  quote               text,
  upload_instructions text,
  video_url           text,
  sort_order          int  not null default 0,
  created_at          timestamptz default now(),
  unique (course_id, slug),
  unique (course_id, sort_order)
);

alter table public.modules enable row level security;

-- Anyone (including unauthenticated) can read module metadata
create policy "modules_public_read" on public.modules
  for select using (true);

-- Only admins can create/edit/delete modules
create policy "modules_admin_write" on public.modules
  for all
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

grant select on public.modules to anon, authenticated;
grant insert, update, delete on public.modules to authenticated;

-- ── SEED: Speaking Confidence Programme modules ────────────────
insert into public.modules
  (course_id, slug, module_number, acronym, theme, title, color, is_free, quote, sort_order)
values
  ('7c4c6ad1-97a5-4bb1-a214-8a43387119bd', '01-warmup',   1, 'W.A.R.M.U.P.',
   'Introduction', 'Comfortable with being uncomfortable', '#C8392B', true,
   '"The body achieves what the mind believes. Get comfortable with discomfort."', 10),
  ('7c4c6ad1-97a5-4bb1-a214-8a43387119bd', '02-scribe',   2, 'S.C.R.I.B.E.',
   'Story', 'The art of storytelling', '#E8A020', false,
   '"Facts inform. Stories persuade. The best speakers know the difference."', 20),
  ('7c4c6ad1-97a5-4bb1-a214-8a43387119bd', '03-physcl',   3, 'P.H.Y.S.C.L.',
   'Body', 'Connecting with the body as a communication tool', '#4A7A8A', false,
   '"Your body speaks before you open your mouth. Make sure it says the right thing."', 30),
  ('7c4c6ad1-97a5-4bb1-a214-8a43387119bd', '04-voices',   4, 'V.O.I.C.E.S.',
   'Voice', 'Developing vocal delivery and control', '#C8392B', false,
   '"The voice is an instrument. Like any instrument, it rewards daily practice."', 40),
  ('7c4c6ad1-97a5-4bb1-a214-8a43387119bd', '05-rainbows', 5, 'R.A.I.N.B.O.W.S.',
   'Mind', 'Managing fear and building a growth mindset', '#E8A020', false,
   '"Nerves are not the enemy — they are energy waiting to be directed."', 50),
  ('7c4c6ad1-97a5-4bb1-a214-8a43387119bd', '06-impact',   6, 'I.M.P.A.C.T. T.H.E.M.',
   'Delivery', 'Delivery mastery — integrating all skills', '#27AE60', false,
   '"The goal is not perfection. The goal is presence, clarity, and connection."', 60);
