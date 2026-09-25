import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Online scoreboard stored in Supabase (schema: supabase/schema.sql). Requests
 * go out as the signed-in user; the database attaches their user_id and only
 * lets signed-in users read or post.
 */

export interface ScoreEntry {
  playerName: string;
  category: string;
  correct: number;
  total: number;
  timeMs: number;
}

export interface LeaderboardRow {
  userId: string;
  playerName: string;
  correct: number;
  total: number;
  timeMs: number;
}

export const LEADERBOARD_SIZE = 10;

export class ScoreboardError extends Error {}

export async function submitScore(client: SupabaseClient, entry: ScoreEntry): Promise<void> {
  // No user_id: the database fills it from the session (default auth.uid()),
  // and its policy rejects any other value.
  const { error } = await client.from('scores').insert({
    player_name: entry.playerName,
    category: entry.category,
    correct: entry.correct,
    total: entry.total,
    time_ms: Math.max(1, Math.round(entry.timeMs)),
  });
  if (error) throw new ScoreboardError(`Couldn't post score: ${error.message}`);
}

interface LeaderboardRecord {
  user_id: string;
  player_name: string;
  correct: number;
  total: number;
  time_ms: number;
}

/** Top players for one category: each account's best, by correct answers then time. */
export async function fetchLeaderboard(client: SupabaseClient, category: string): Promise<LeaderboardRow[]> {
  const { data, error } = await client
    .from('leaderboard')
    .select('user_id,player_name,correct,total,time_ms')
    .eq('category', category)
    .order('correct', { ascending: false })
    .order('time_ms', { ascending: true })
    .limit(LEADERBOARD_SIZE);
  if (error) throw new ScoreboardError(`Couldn't load scoreboard: ${error.message}`);
  return (data as LeaderboardRecord[]).map((r) => ({
    userId: r.user_id,
    playerName: r.player_name,
    correct: r.correct,
    total: r.total,
    timeMs: r.time_ms,
  }));
}
