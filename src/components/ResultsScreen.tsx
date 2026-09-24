import type { ReactNode } from 'react';
import type { BestScore } from '../lib/scores';
import type { AnswerRecord } from '../types';
import { formatDuration } from './format';

interface Props {
  records: AnswerRecord[];
  timeMs: number;
  isNewBest: boolean;
  best: BestScore | null;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
  /** Extra content shown under the actions (the online scoreboard). */
  children?: ReactNode;
}

function verdict(percent: number): string {
  if (percent === 100) return 'Perfect navigation!';
  if (percent >= 80) return 'Excellent sense of direction.';
  if (percent >= 50) return 'Solid bearings.';
  return 'Keep exploring!';
}

export function ResultsScreen({ records, timeMs, isNewBest, best, onPlayAgain, onChangeSettings, children }: Props) {
  const correct = records.filter((r) => r.correct).length;
  const percent = records.length ? Math.round((correct / records.length) * 100) : 0;
  const missed = records.filter((r) => !r.correct);

  return (
    <section className="card results" aria-labelledby="results-title">
      <h2 id="results-title">{verdict(percent)}</h2>
      <p className="big-score">
        {correct} <span>/ {records.length}</span>
      </p>
      <p className="hint">
        {percent}% · {formatDuration(timeMs)}
      </p>
      {isNewBest ? (
        <p className="badge">★ New best score!</p>
      ) : (
        best && (
          <p className="hint">
            Best: {best.correct}/{best.total} in {formatDuration(best.timeMs)}
          </p>
        )
      )}

      <div className="actions">
        <button type="button" className="primary" onClick={onPlayAgain}>
          Play again
        </button>
        <button type="button" className="secondary" onClick={onChangeSettings}>
          Change settings
        </button>
      </div>

      {children}

      {missed.length > 0 && (
        <div className="review">
          <h3>To review ({missed.length})</h3>
          <ul>
            {missed.map(({ question, selected }) => (
              <li key={question.country.name}>
                <span className="review-prompt">{question.prompt}</span>
                <span>
                  <strong>{question.answer}</strong>
                  <span className="review-given">
                    {selected === null ? ' — timed out' : ` — you said ${selected}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
