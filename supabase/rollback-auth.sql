-- One-time rollback of the sign-in version of the scoreboard (PR #8) to the
-- public version (no sign-in). Run once in the Supabase SQL editor. Safe to re-run.
--
-- Afterwards the database accepts the public app again (anyone can read scores
-- and add new ones, never change or delete them). Signed-in requests keep
-- working too, so it does not matter whether this runs before or after the
-- app itself is rolled back.
--
-- Kept on purpose: the user_id column (now optional) and the account links on
-- scores posted while sign-in was required. Nothing is deleted.

-- Scores posted without signing in have no account.
alter table public.scores alter column user_id drop not null;

-- Replace the signed-in-only policies with the public ones.
drop policy if exists "Signed-in users can read scores" on public.scores;
drop policy if exists "Signed-in users can add their own scores" on public.scores;

drop policy if exists "Anyone can read scores" on public.scores;
create policy "Anyone can read scores" on public.scores
  for select to anon, authenticated using (true);

-- Anyone can post, but a score can only carry the poster's own account (or none).
drop policy if exists "Anyone can add a score" on public.scores;
create policy "Anyone can add a score" on public.scores
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

revoke update, delete, truncate on public.scores from anon, authenticated;
grant select, insert on public.scores to anon, authenticated;

-- Back to one best score per player name (case-insensitive), as the public
-- app expects. Dropped first because its columns change (user_id removed).
drop view if exists public.leaderboard;
create view public.leaderboard with (security_invoker = true) as
select distinct on (category, lower(player_name))
  category, player_name, correct, total, time_ms, created_at
from public.scores
order by category, lower(player_name), correct desc, time_ms asc, created_at asc;

grant select on public.leaderboard to anon, authenticated;
