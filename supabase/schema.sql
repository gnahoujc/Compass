-- Compass scoreboard schema. Run in the Supabase SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run). Safe to re-run.
--
-- Only signed-in (invited) users can read the scoreboard or post scores, and
-- only as themselves. Nobody can change or delete scores through the app;
-- deleting a user in Authentication → Users deletes their scores too.
-- The checks below reject malformed entries; they cannot stop a signed-in
-- user from posting a fake but well-formed score.

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

-- Every score belongs to the account that posted it. The default fills it in
-- from the caller's session, so the app never sends it.
alter table public.scores
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade;

-- Scores from before sign-in was required have no owner; remove them.
delete from public.scores where user_id is null;

alter table public.scores alter column user_id set not null;

create index if not exists scores_category_idx on public.scores (category);
create index if not exists scores_user_id_idx on public.scores (user_id);

alter table public.scores enable row level security;

-- Policies from the public (no sign-in) version.
drop policy if exists "Anyone can read scores" on public.scores;
drop policy if exists "Anyone can add a score" on public.scores;

-- Signed-in users only. Anonymous sign-ins (off in this project) would also
-- count as "authenticated", so they are excluded explicitly.
drop policy if exists "Signed-in users can read scores" on public.scores;
create policy "Signed-in users can read scores" on public.scores
  for select to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "Signed-in users can add their own scores" on public.scores;
create policy "Signed-in users can add their own scores" on public.scores
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

-- No update or delete policies: with row level security on, both are denied.
revoke all on public.scores from anon;
revoke update, delete, truncate on public.scores from authenticated;
grant select, insert on public.scores to authenticated;

-- Each account's best score per category, ranked by correct answers, then time.
-- Dropped first because its columns changed (user_id added). security_invoker
-- makes the view obey the table's row level security.
drop view if exists public.leaderboard;
create view public.leaderboard with (security_invoker = true) as
select distinct on (category, user_id)
  category, user_id, player_name, correct, total, time_ms, created_at
from public.scores
order by category, user_id, correct desc, time_ms asc, created_at asc;

revoke all on public.leaderboard from anon;
grant select on public.leaderboard to authenticated;
