import type { SupabaseClient } from '@supabase/supabase-js';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { categoryKey } from '../lib/scores';
import type { QuizSettings } from '../types';
import { describeSettings } from './format';
import { Leaderboard } from './Leaderboard';

interface Props {
  client: SupabaseClient;
  currentUserId: string;
  settings: QuizSettings;
  onBack: () => void;
}

export function ScoreboardScreen({ client, currentUserId, settings, onBack }: Props) {
  const board = useLeaderboard(client, categoryKey(settings));
  return (
    <section className="card scoreboard-screen" aria-labelledby="scoreboard-screen-title">
      <h2 id="scoreboard-screen-title">Scoreboard</h2>
      <p className="hint">{describeSettings(settings)}</p>
      <Leaderboard
        rows={board.rows}
        error={board.error}
        currentUserId={currentUserId}
        onRetry={() => void board.reload()}
      />
      <div className="actions">
        <button type="button" className="secondary" onClick={onBack}>
          Back
        </button>
      </div>
    </section>
  );
}
