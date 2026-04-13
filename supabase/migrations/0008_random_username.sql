-- ─────────────────────────────────────────────────────────────────
-- 0008_random_username.sql
-- Replace email-derived usernames with random space-themed ones.
--
-- generate_random_username() → adjective_noun_NNN  (e.g. cosmic_wanderer_847)
-- handle_new_user() updated to use the generator.
-- ─────────────────────────────────────────────────────────────────

-- 1. Random username generator ────────────────────────────────────
create or replace function public.generate_random_username()
returns text language plpgsql as $$
declare
  adjectives text[] := array[
    'cosmic','stellar','solar','lunar','void','nova','astral','nebula',
    'orbital','galactic','frozen','burning','silent','ancient','wild',
    'deep','distant','bright','hollow','drifting'
  ];
  nouns text[] := array[
    'wanderer','explorer','ranger','pilot','drifter','voyager','seeker',
    'captain','guardian','navigator','surveyor','sentinel','specter',
    'phantom','horizon','eclipse','comet','pulsar','quasar','ion'
  ];
  candidate text;
begin
  loop
    candidate :=
      adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
      || '_'
      || nouns[1 + floor(random() * array_length(nouns, 1))::int]
      || '_'
      || lpad((floor(random() * 900) + 100)::int::text, 3, '0');

    exit when not exists (select 1 from public.users where username = candidate);
  end loop;

  return candidate;
end; $$;

-- 2. Update handle_new_user to use generator ──────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, username, display_name, avatar_url)
  values (
    new.id,
    public.generate_random_username(),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end; $$;
