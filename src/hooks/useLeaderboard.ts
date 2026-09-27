import { useCallback, useEffect, useState } from 'react';
import { fetchLeaderboard, type LeaderboardRow, type ScoreboardConfig } from '../lib/scoreboard';

/** Loads the leaderboard for a category; `reload` refetches (e.g. after posting a score). */
export function useLeaderboard(config: ScoreboardConfig, category: string, autoLoad = true) {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setError(false);
    try {
      setRows(await fetchLeaderboard(config, category));
    } catch {
      setError(true);
    }
  }, [config, category]);

  useEffect(() => {
    if (autoLoad) void reload();
  }, [autoLoad, reload]);

  return { rows, error, reload };
}
