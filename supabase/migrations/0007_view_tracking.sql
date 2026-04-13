-- ─────────────────────────────────────────────────────────────────
-- 0007_view_tracking.sql
-- Replace naive view_count RPC with a proper analytics table.
--
-- Design:
--   • planet_views stores one row per unique view event
--   • Dedup: 1 view per (planet + viewer) per UTC day
--     - authenticated users  → keyed on (planet_id, viewer_id, day)
--     - guests               → keyed on (planet_id, ip_hash,   day)
--   • A trigger keeps planets.view_count in sync automatically
--   • record_planet_view() replaces increment_planet_views()
-- ─────────────────────────────────────────────────────────────────

-- 1. Analytics table ──────────────────────────────────────────────
create table public.planet_views (
  id          bigint generated always as identity primary key,
  planet_id   uuid        not null references public.planets(id) on delete cascade,
  viewer_id   uuid        references auth.users(id) on delete set null,  -- null for guests
  ip_hash     text        not null,  -- truncated SHA-256(salt+ip), never raw IP
  viewed_at   timestamptz not null default now()
);

-- 2. Dedup unique indexes (partial) ───────────────────────────────
-- Authenticated users: one view per (planet, user) per UTC calendar day
create unique index ux_planet_views_user_daily
  on public.planet_views (
    planet_id,
    viewer_id,
    date_trunc('day', viewed_at at time zone 'utc')
  )
  where viewer_id is not null;

-- Guests: one view per (planet, ip_hash) per UTC calendar day
create unique index ux_planet_views_ip_daily
  on public.planet_views (
    planet_id,
    ip_hash,
    date_trunc('day', viewed_at at time zone 'utc')
  )
  where viewer_id is null;

-- 3. Analytics/query index ────────────────────────────────────────
create index idx_planet_views_planet_time
  on public.planet_views (planet_id, viewed_at desc);

-- 4. RLS — deny all direct client access; writes are via security definer only
alter table public.planet_views enable row level security;

-- 5. Trigger: keep planets.view_count denormalized and always accurate ──
create or replace function public.trgfn_increment_view_count()
returns trigger language plpgsql security definer as $$
begin
  update public.planets
    set view_count = view_count + 1
  where id = new.planet_id;
  return new;
end; $$;

create trigger trg_planet_views_inc_count
  after insert on public.planet_views
  for each row execute procedure public.trgfn_increment_view_count();

-- 6. record_planet_view() ─────────────────────────────────────────
-- Inserts a view row when it hasn't been seen today yet.
-- Returns true if a new view was recorded, false if deduped.
-- Errors are swallowed — view counting is non-critical.
create or replace function public.record_planet_view(
  p_planet_id  uuid,
  p_viewer_id  uuid,   -- pass null for unauthenticated visitors
  p_ip_hash    text
)
returns boolean language plpgsql security definer as $$
declare
  v_today date := current_date;
begin
  if p_viewer_id is not null then
    -- Dedup check for authenticated user
    if exists (
      select 1 from public.planet_views
       where planet_id = p_planet_id
         and viewer_id = p_viewer_id
         and viewed_at::date = v_today
    ) then
      return false;
    end if;
  else
    -- Dedup check for guest (ip-based)
    if exists (
      select 1 from public.planet_views
       where planet_id = p_planet_id
         and viewer_id is null
         and ip_hash   = p_ip_hash
         and viewed_at::date = v_today
    ) then
      return false;
    end if;
  end if;

  insert into public.planet_views (planet_id, viewer_id, ip_hash)
  values (p_planet_id, p_viewer_id, p_ip_hash);

  return true;

exception
  when unique_violation then return false;  -- race condition safety net
  when others           then return false;  -- non-critical; swallow
end; $$;

-- 7. Remove old function (replaced by record_planet_view + trigger) ──
drop function if exists public.increment_planet_views(uuid);
