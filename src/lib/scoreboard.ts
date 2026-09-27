/**
 * Online scoreboard stored in Supabase (schema: supabase/schema.sql), reached
 * through its REST API. Configured at build time with VITE_SUPABASE_URL and
 * VITE_SUPABASE_KEY; without them the scoreboard is simply turned off.
 */

export interface ScoreboardConfig {
  url: string;
  /** The project's public ("publishable" or legacy "anon") key; safe to ship to browsers. */
  key: string;
}

export interface ScoreEntry {
  playerName: string;
  category: string;
  correct: number;
  total: number;
  timeMs: number;
}

export interface LeaderboardRow {
  playerName: string;
  correct: number;
  total: number;
  timeMs: number;
}

export const LEADERBOARD_SIZE = 10;

export function scoreboardConfig(
  url: string | undefined = import.meta.env.VITE_SUPABASE_URL,
  key: string | undefined = import.meta.env.VITE_SUPABASE_KEY,
): ScoreboardConfig | null {
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ''), key };
}

function headers(config: ScoreboardConfig): Record<string, string> {
  const h: Record<string, string> = { apikey: config.key };
  // Legacy anon keys are JWTs and also go in Authorization; the newer
  // publishable keys (sb_publishable_…) must only be sent as `apikey`.
  if (config.key.startsWith('eyJ')) h.Authorization = `Bearer ${config.key}`;
  return h;
}

export class ScoreboardError extends Error {}

async function check(response: Response): Promise<Response> {
  if (!response.ok) throw new ScoreboardError(`Scoreboard request failed (HTTP ${response.status})`);
  return response;
}

export async function submitScore(
  config: ScoreboardConfig,
  entry: ScoreEntry,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  await check(
    await fetchImpl(`${config.url}/rest/v1/scores`, {
      method: 'POST',
      headers: { ...headers(config), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        player_name: entry.playerName,
        category: entry.category,
        correct: entry.correct,
        total: entry.total,
        time_ms: Math.max(1, Math.round(entry.timeMs)),
      }),
    }),
  );
}

interface LeaderboardRecord {
  player_name: string;
  correct: number;
  total: number;
  time_ms: number;
}

/** Top players for one category: each player's best, by correct answers then time. */
export async function fetchLeaderboard(
  config: ScoreboardConfig,
  category: string,
  fetchImpl: typeof fetch = fetch,
): Promise<LeaderboardRow[]> {
  const params = new URLSearchParams({
    select: 'player_name,correct,total,time_ms',
    category: `eq.${category}`,
    order: 'correct.desc,time_ms.asc',
    limit: String(LEADERBOARD_SIZE),
  });
  const response = await check(await fetchImpl(`${config.url}/rest/v1/leaderboard?${params}`, { headers: headers(config) }));
  const rows = (await response.json()) as LeaderboardRecord[];
  return rows.map((r) => ({ playerName: r.player_name, correct: r.correct, total: r.total, timeMs: r.time_ms }));
}
