import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchLeaderboard, type LeaderboardRow } from '../lib/scoreboard';

/** Loads the leaderboard for a category; `reload` refetches (e.g. after posting a score). */
export function useLeaderboard(client: SupabaseClient, category: string, autoLoad = true) {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setError(false);
    try {
      setRows(await fetchLeaderboard(client, category));
    } catch {
      setError(true);
    }
  }, [client, category]);

  useEffect(() => {
    if (autoLoad) void reload();
  }, [autoLoad, reload]);

  return { rows, error, reload };
}
