import type { LeaderboardRow } from '../lib/scoreboard';
import { formatDuration } from './format';

interface Props {
  rows: LeaderboardRow[] | null;
  error: boolean;
  /** Rows for this player (case-insensitive) are highlighted. */
  highlightName?: string | null;
  onRetry: () => void;
}

export function Leaderboard({ rows, error, highlightName, onRetry }: Props) {
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

  const me = highlightName?.toLowerCase();
  // Rows arrive best first; players with exactly the same result share the top spot.
  const [top] = rows;
  const isLeader = (row: LeaderboardRow) => row.correct === top.correct && row.timeMs === top.timeMs;
  return (
    <ol className="leaderboard">
      {rows.map((row, i) => (
        <li
          key={row.playerName.toLowerCase()}
          className={[isLeader(row) && 'leader', row.playerName.toLowerCase() === me && 'me'].filter(Boolean).join(' ') || undefined}
        >
          {isLeader(row) ? (
            <span className="rank">
              <span aria-hidden="true">🏆</span>
              <span className="visually-hidden">{i + 1}, top score</span>
            </span>
          ) : (
            <span className="rank">{i + 1}</span>
          )}
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
