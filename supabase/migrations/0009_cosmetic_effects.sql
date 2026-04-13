-- ─────────────────────────────────────────────────────────────────
-- 0009_cosmetic_effects.sql
-- Adds optional visual effect for premium planets.
-- ─────────────────────────────────────────────────────────────────

create type cosmetic_effect_type as enum ('sparkles', 'rings', 'aura');

alter table public.planets
  add column cosmetic_effect cosmetic_effect_type null;

-- Only premium planets may have an effect
alter table public.planets
  add constraint chk_cosmetic_premium
    check (cosmetic_effect is null or tier_at_creation = 'premium');
