-- ─────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────
-- uuid-ossp is not needed — gen_random_uuid() is native in Postgres 13+
-- pg_cron is enabled by Supabase for scheduled jobs
create extension if not exists "pg_cron" with schema extensions;

-- ─────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────
create type user_tier as enum ('guest', 'registered', 'premium');
create type planet_type as enum ('rocky', 'gaseous', 'icy', 'lava', 'ocean', 'desert', 'ringed');
create type star_type as enum ('yellow_dwarf', 'red_dwarf', 'blue_giant', 'white_dwarf', 'neutron');
create type subscription_status as enum ('active', 'past_due', 'cancelled', 'trialing', 'pending');
create type subscription_plan as enum ('monthly', 'annual');

-- ─────────────────────────────────────────────
-- Shared trigger: auto-update updated_at
-- ─────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ─────────────────────────────────────────────
-- USERS  (extends auth.users)
-- ─────────────────────────────────────────────
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null
                  check (char_length(username) between 3 and 30)
                  check (username ~ '^[a-zA-Z0-9_\-]+$'),
  display_name  text,
  tier          user_tier not null default 'registered',
  avatar_url    text,
  bio           text check (char_length(bio) <= 200),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_users_username on public.users(username);

create trigger trg_users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

-- Auto-create profile on Supabase auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  base_username text;
  final_username text;
  suffix integer := 0;
begin
  base_username := coalesce(
    new.raw_user_meta_data->>'preferred_username',
    new.raw_user_meta_data->>'user_name',
    split_part(new.email, '@', 1)
  );
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_\-]', '', 'g');
  base_username := left(base_username, 25);
  if char_length(base_username) < 3 then base_username := 'user'; end if;

  final_username := base_username;
  while exists (select 1 from public.users where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.users (id, username, display_name, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end; $$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- GUEST SESSIONS
-- ─────────────────────────────────────────────
create table public.guest_sessions (
  id             uuid primary key default gen_random_uuid(),
  session_token  text unique not null,   -- sha256(JWT jti), hex-encoded
  ip_hash        text,                   -- sha256(client IP)
  planet_count   smallint not null default 0,
  expires_at     timestamptz not null default now() + interval '7 days',
  created_at     timestamptz not null default now()
);

create index idx_guest_sessions_token   on public.guest_sessions(session_token);
create index idx_guest_sessions_expires on public.guest_sessions(expires_at);

-- ─────────────────────────────────────────────
-- SYSTEMS  (solar systems)
-- ─────────────────────────────────────────────
create table public.systems (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null check (slug ~ '^[a-z0-9\-]+$'),
  star_type   star_type not null default 'yellow_dwarf',
  description text,
  max_planets integer not null default 200,
  is_default  boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Enforce single default system
create unique index idx_systems_one_default on public.systems(is_default) where is_default = true;
create index idx_systems_slug             on public.systems(slug);

-- ─────────────────────────────────────────────
-- PLANETS
-- ─────────────────────────────────────────────
create table public.planets (
  id                  uuid primary key default gen_random_uuid(),

  -- One of these is set; the other is null
  user_id             uuid references public.users(id) on delete set null,
  guest_session_id    uuid references public.guest_sessions(id) on delete set null,

  name                text not null default 'Unnamed Planet'
                        check (char_length(name) between 1 and 40),
  planet_type         planet_type not null default 'rocky',

  -- Serialized Fabric.js canvas (JSON)
  canvas_data         jsonb not null,
  -- PNG stored in Supabase Storage (planet-textures bucket)
  texture_url         text,

  system_id           uuid not null references public.systems(id),

  -- Orbit placement (computed on insert)
  orbit_radius        numeric(8,2)  not null default 30,
  orbit_speed         numeric(6,4)  not null default 0.2,
  orbit_offset        numeric(6,4)  not null default 0,
  orbit_inclination   numeric(5,3)  not null default 0,

  -- Tier snapshot at creation time
  tier_at_creation    user_tier not null default 'guest',

  -- Lifecycle
  lifespan_expires_at timestamptz,   -- null = permanent (premium only)
  last_activity_at    timestamptz not null default now(),
  is_active           boolean not null default true,

  view_count          bigint not null default 0,
  created_at          timestamptz not null default now(),

  -- Constraints
  constraint chk_planet_owner check (
    (user_id is not null and guest_session_id is null) or
    (user_id is null and guest_session_id is not null)
  ),
  constraint chk_guest_planet_type check (
    tier_at_creation != 'guest' or planet_type = 'rocky'
  ),
  constraint chk_premium_permanent check (
    tier_at_creation = 'premium' or lifespan_expires_at is not null
  )
);

create index idx_planets_system  on public.planets(system_id, is_active, lifespan_expires_at);
create index idx_planets_user    on public.planets(user_id) where user_id is not null;
create index idx_planets_session on public.planets(guest_session_id) where guest_session_id is not null;
create index idx_planets_expires on public.planets(lifespan_expires_at) where lifespan_expires_at is not null;
create index idx_planets_active  on public.planets(is_active, created_at desc);

-- ─────────────────────────────────────────────
-- SUBSCRIPTIONS
-- ─────────────────────────────────────────────
create table public.subscriptions (
  id                            uuid primary key default gen_random_uuid(),
  user_id                       uuid not null references public.users(id) on delete cascade,
  plan                          subscription_plan not null,
  status                        subscription_status not null default 'pending',
  mercadopago_subscription_id   text unique,
  mercadopago_payer_id          text,
  current_period_start          timestamptz not null default now(),
  current_period_end            timestamptz not null,
  cancelled_at                  timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

-- Only one active/trialing subscription per user
create unique index idx_subscriptions_user_active
  on public.subscriptions(user_id)
  where status in ('active', 'trialing');

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- Sync subscription status → users.tier
create or replace function public.sync_user_tier()
returns trigger language plpgsql security definer as $$
begin
  if new.status in ('active', 'trialing') then
    update public.users set tier = 'premium' where id = new.user_id;
  else
    update public.users set tier = 'registered' where id = new.user_id;
  end if;
  return new;
end; $$;

create trigger trg_sync_tier_on_subscription
  after insert or update on public.subscriptions
  for each row execute procedure public.sync_user_tier();

-- ─────────────────────────────────────────────
-- Helper RPC: increment planet view count atomically
-- ─────────────────────────────────────────────
create or replace function public.increment_planet_views(planet_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.planets
    set view_count = view_count + 1
  where id = planet_id;
end; $$;

-- ─────────────────────────────────────────────
-- FUNCTION: expire planets (hourly via pg_cron)
-- ─────────────────────────────────────────────
create or replace function public.expire_planets()
returns void language plpgsql as $$
begin
  update public.planets
    set is_active = false
  where
    lifespan_expires_at is not null
    and lifespan_expires_at < now()
    and is_active = true;
end; $$;

select cron.schedule('expire-planets', '0 * * * *', 'select public.expire_planets()');

-- ─────────────────────────────────────────────
-- FUNCTION: daily subscription safety-net
-- ─────────────────────────────────────────────
create or replace function public.check_subscription_expiry()
returns void language plpgsql security definer as $$
begin
  update public.subscriptions
    set status = 'past_due'
  where
    status = 'active'
    and current_period_end < now();
end; $$;

select cron.schedule('check-sub-expiry', '30 0 * * *', 'select public.check_subscription_expiry()');
