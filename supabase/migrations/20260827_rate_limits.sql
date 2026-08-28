-- ════════════════════════════════════════════════════════════════
-- MIGRATION — 2026-08-27
-- Durable, IP-keyed rate limiting for Netlify Functions.
-- Backs ai-coach.js and subscribe-free.js (see netlify/functions/_rate-limit.js).
--
-- Replaces the per-process in-memory Map in ai-coach.js, which reset on
-- every cold start and was keyed on a client-supplied sessionId.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.rate_limits (
  bucket       text        not null,   -- e.g. 'ai-coach', 'subscribe-free'
  identifier   text        not null,   -- caller IP (or 'session:<uuid>' fallback)
  count        integer     not null default 0,
  window_start timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (bucket, identifier)
);

alter table public.rate_limits enable row level security;
-- No policies: service-role only, exactly like pending_access.

-- Fixed-window counter. One row-locked round trip: increments and reports
-- in the same statement so concurrent requests from one IP can't race past
-- the limit. Returns exactly one row.
create or replace function public.rate_limit_hit(
  p_bucket         text,
  p_identifier     text,
  p_limit          integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer set search_path = public
as $$
declare
  v_now    timestamptz := now();
  v_window interval    := make_interval(secs => p_window_seconds);
  v_row    public.rate_limits%rowtype;
begin
  select * into v_row
    from public.rate_limits
   where bucket = p_bucket and identifier = p_identifier
   for update;

  -- First hit for this key (on conflict: a concurrent first hit already
  -- created the row — count that one too rather than erroring)
  if not found then
    insert into public.rate_limits (bucket, identifier, count, window_start, updated_at)
    values (p_bucket, p_identifier, 1, v_now, v_now)
    on conflict (bucket, identifier) do update
      set count = public.rate_limits.count + 1, updated_at = v_now;
    return query select true, greatest(p_limit - 1, 0), 0;
    return;
  end if;

  -- Window has rolled over → start a fresh one
  if v_now - v_row.window_start >= v_window then
    update public.rate_limits
       set count = 1, window_start = v_now, updated_at = v_now
     where bucket = p_bucket and identifier = p_identifier;
    return query select true, greatest(p_limit - 1, 0), 0;
    return;
  end if;

  -- Inside the window, already at the cap → deny
  if v_row.count >= p_limit then
    return query select
      false,
      0,
      greatest(ceil(extract(epoch from (v_row.window_start + v_window - v_now)))::integer, 1);
    return;
  end if;

  -- Inside the window, under the cap → count this hit
  update public.rate_limits
     set count = v_row.count + 1, updated_at = v_now
   where bucket = p_bucket and identifier = p_identifier;
  return query select true, greatest(p_limit - v_row.count - 1, 0), 0;
end;
$$;

-- Optional housekeeping: drop stale rows. Safe to run manually or on a schedule.
-- delete from public.rate_limits where updated_at < now() - interval '2 days';
