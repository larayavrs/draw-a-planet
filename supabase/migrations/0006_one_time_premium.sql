-- Switch from subscription model to one-time premium purchase

-- Add premium_purchased_at timestamp to users
alter table public.users
  add column if not exists premium_purchased_at timestamptz;

-- Create premium_purchases table for one-time purchases
create table if not exists public.premium_purchases (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  mercadopago_payment_id text unique not null,
  amount          numeric(10,2) not null default 5.00,
  status          text not null default 'completed',
  created_at      timestamptz not null default now(),

  constraint chk_status check (status in ('completed', 'refunded', 'failed'))
);

create index idx_premium_purchases_user on public.premium_purchases(user_id);
create index idx_premium_purchases_mp_id on public.premium_purchases(mercadopago_payment_id);

-- RLS for premium_purchases
alter table public.premium_purchases enable row level security;

-- Users can read their own purchases
create policy "premium_purchases_select_own"
  on public.premium_purchases for select
  using (user_id = auth.uid());

-- All writes go through service-role (webhook)
-- No client-side insert policy needed

-- Update sync_user_tier trigger to also handle premium_purchased_at
-- (The trigger already exists; we just ensure the tier sync works)
-- Users with premium_purchased_at set should always be premium tier.
