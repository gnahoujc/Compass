import type { LeaderboardRow } from '../lib/scoreboard';
import { formatDuration } from './format';

interface Props {
  rows: LeaderboardRow[] | null;
  error: boolean;
  /** The signed-in user's row is highlighted. */
  currentUserId: string;
  onRetry: () => void;
}

export function Leaderboard({ rows, error, currentUserId, onRetry }: Props) {
  if (error) {
    return (
      <p className="hint">
        Couldn't load the scoreboard.{' '}
        <button type="button" className="link" onClick={onRetry}>
          Try again
        </button>
      </p>
    );
  }
  if (!rows) return <p className="hint">Loading scoreboard…</p>;
  if (rows.length === 0) return <p className="hint">No scores yet for these settings. Be the first!</p>;

  return (
    <ol className="leaderboard">
      {rows.map((row, i) => (
        <li key={row.userId} className={row.userId === currentUserId ? 'me' : undefined}>
          <span className="rank">{i + 1}</span>
          <span className="player">{row.playerName}</span>
          <span className="lb-score">
            {row.correct}/{row.total}
          </span>
          <span className="lb-time">{formatDuration(row.timeMs)}</span>
        </li>
      ))}
    </ol>
  );
}
