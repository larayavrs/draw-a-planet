-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

alter table public.users         enable row level security;
alter table public.guest_sessions enable row level security;
alter table public.systems        enable row level security;
alter table public.planets        enable row level security;
alter table public.subscriptions  enable row level security;

-- ── USERS ──────────────────────────────────
create policy "users_select_public"
  on public.users for select
  using (true);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── SYSTEMS ─────────────────────────────────
create policy "systems_select_active"
  on public.systems for select
  using (is_active = true);

-- ── PLANETS ─────────────────────────────────
create policy "planets_select_active"
  on public.planets for select
  using (is_active = true);

-- Registered users insert their own planets directly
create policy "planets_insert_registered"
  on public.planets for insert
  with check (
    auth.uid() = user_id
    and guest_session_id is null
  );

-- Guest planet inserts go through service-role API only (no client RLS path)

create policy "planets_update_own"
  on public.planets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "planets_delete_own"
  on public.planets for delete
  using (auth.uid() = user_id);

-- ── SUBSCRIPTIONS ────────────────────────────
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- All subscription writes go through the service-role webhook handler only.

-- ── GUEST SESSIONS ───────────────────────────
-- No client-side access. All managed through service-role API routes.
-- (Policies intentionally omitted — default deny covers this.)
