-- Compass scoreboard schema. Run once in the Supabase SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run). Safe to re-run.
--
-- Anyone with the site's public key can read scores and add new ones, but
-- never change or delete them. The checks below reject malformed entries;
-- they cannot stop someone from posting a fake but well-formed score.

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  player_name text not null,
  -- Settings the quiz was played with: mode:continents:questionCount:timerSeconds,
  -- e.g. "capital:all:10:15" or "country:Asia,Europe:20:0".
  category text not null,
  correct integer not null,
  total integer not null,
  time_ms integer not null,
  created_at timestamptz not null default now(),

  constraint player_name_valid check (
    char_length(player_name) between 1 and 20
    and player_name = btrim(player_name)
    and player_name !~ '[[:cntrl:]]'
  ),
  constraint category_valid check (
    category ~ '^(capital|country):(all|[A-Za-z ,]{4,80}):[0-9]{1,3}:(0|10|15|30)$'
  ),
  constraint total_valid check (total between 1 and 195),
  constraint correct_valid check (correct between 0 and total),
  constraint time_valid check (time_ms between 1 and 36000000)
);

create index if not exists scores_category_idx on public.scores (category);

alter table public.scores enable row level security;

drop policy if exists "Anyone can read scores" on public.scores;
create policy "Anyone can read scores" on public.scores
  for select to anon, authenticated using (true);

drop policy if exists "Anyone can add a score" on public.scores;
create policy "Anyone can add a score" on public.scores
  for insert to anon, authenticated with check (true);

-- No update or delete policies: with row level security on, both are denied.
revoke update, delete, truncate on public.scores from anon, authenticated;
grant select, insert on public.scores to anon, authenticated;

-- Each player's best score per category (names compared case-insensitively),
-- ranked by correct answers, then time. security_invoker makes the view obey
-- the table's row level security instead of running as its owner.
create or replace view public.leaderboard with (security_invoker = true) as
select distinct on (category, lower(player_name))
  category, player_name, correct, total, time_ms, created_at
from public.scores
order by category, lower(player_name), correct desc, time_ms asc, created_at asc;

grant select on public.leaderboard to anon, authenticated;
