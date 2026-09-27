import { useLeaderboard } from '../hooks/useLeaderboard';
import { normalizeName } from '../lib/player';
import type { ScoreboardConfig } from '../lib/scoreboard';
import { categoryKey } from '../lib/scores';
import type { QuizSettings } from '../types';
import { describeSettings } from './format';
import { Leaderboard } from './Leaderboard';

interface Props {
  config: ScoreboardConfig;
  settings: QuizSettings;
  playerName: string;
  onBack: () => void;
}

export function ScoreboardScreen({ config, settings, playerName, onBack }: Props) {
  const board = useLeaderboard(config, categoryKey(settings));
  return (
    <section className="card scoreboard-screen" aria-labelledby="scoreboard-screen-title">
      <h2 id="scoreboard-screen-title">Scoreboard</h2>
      <p className="hint">{describeSettings(settings)}</p>
      <Leaderboard
        rows={board.rows}
        error={board.error}
        highlightName={normalizeName(playerName)}
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
