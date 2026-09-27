import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { MAX_NAME_LENGTH, normalizeName } from '../lib/player';
import { submitScore, type ScoreboardConfig } from '../lib/scoreboard';
import { Leaderboard } from './Leaderboard';

interface Props {
  config: ScoreboardConfig;
  category: string;
  label: string;
  score: { correct: number; total: number; timeMs: number };
  playerName: string;
  onPlayerNameChange: (name: string) => void;
}

type PostStatus = 'idle' | 'posting' | 'posted' | 'error';

/**
 * Results-screen scoreboard. With a registered name the score is posted
 * automatically; otherwise the player can enter a name and post it.
 */
export function ScoreboardPanel({ config, category, label, score, playerName, onPlayerNameChange }: Props) {
  const name = normalizeName(playerName);
  const [status, setStatus] = useState<PostStatus>('idle');
  /** The name the score was (or is being) posted under. */
  const [postedAs, setPostedAs] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [draftInvalid, setDraftInvalid] = useState(false);
  // With a name, the board loads after posting so it includes this score.
  const board = useLeaderboard(config, category, !name);
  // Guards against posting twice (e.g. React StrictMode re-running effects).
  const postStarted = useRef(false);

  const post = useCallback(
    async (as: string) => {
      postStarted.current = true;
      setPostedAs(as);
      setStatus('posting');
      try {
        await submitScore(config, { ...score, playerName: as, category });
        setStatus('posted');
      } catch {
        setStatus('error');
      }
      await board.reload();
    },
    [config, score, category, board],
  );

  useEffect(() => {
    if (name && !postStarted.current) void post(name);
  }, [name, post]);

  const submitDraft = (e: FormEvent) => {
    e.preventDefault();
    const n = normalizeName(draft);
    if (!n) {
      setDraftInvalid(true);
      return;
    }
    onPlayerNameChange(n);
    void post(n);
  };

  return (
    <section className="scoreboard" aria-labelledby="scoreboard-title">
      <h3 id="scoreboard-title">Scoreboard</h3>
      <p className="hint">{label}</p>

      <div className="post-status" aria-live="polite">
        {status === 'posting' && <p className="hint">Posting your score…</p>}
        {status === 'posted' && (
          <p className="hint">
            Score posted as <strong>{postedAs}</strong>.
          </p>
        )}
        {status === 'error' && (
          <p className="hint error">
            Couldn't post your score.{' '}
            <button type="button" className="link" onClick={() => postedAs && void post(postedAs)}>
              Try again
            </button>
          </p>
        )}
      </div>

      {!name && status === 'idle' && (
        <form className="name-form" onSubmit={submitDraft}>
          <label htmlFor="post-name">Add your name to post this score</label>
          <div>
            <input
              id="post-name"
              value={draft}
              maxLength={MAX_NAME_LENGTH}
              autoComplete="nickname"
              placeholder="Your name"
              aria-invalid={draftInvalid}
              onChange={(e) => {
                setDraft(e.target.value);
                setDraftInvalid(false);
              }}
            />
            <button type="submit" className="primary">
              Post score
            </button>
          </div>
          {draftInvalid && <p className="hint error">Enter a name (up to {MAX_NAME_LENGTH} characters).</p>}
        </form>
      )}

      <Leaderboard rows={board.rows} error={board.error} highlightName={postedAs ?? name} onRetry={() => void board.reload()} />
    </section>
  );
}
