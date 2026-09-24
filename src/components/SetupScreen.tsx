import { useState } from 'react';
import { COUNTRIES } from '../data/countries';
import { filterByContinents } from '../lib/quiz';
import { MAX_NAME_LENGTH } from '../lib/player';
import { loadBest } from '../lib/scores';
import { CONTINENTS, type Continent, type QuizMode, type QuizSettings } from '../types';
import { formatDuration } from './format';

const COUNT_OPTIONS = [10, 20, 50] as const;
const TIMER_OPTIONS = [0, 10, 15, 30] as const;

interface Props {
  initial: QuizSettings;
  onStart: (settings: QuizSettings) => void;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  /** Opens the online scoreboard for the chosen settings; absent when the scoreboard is off. */
  onShowScoreboard?: (settings: QuizSettings) => void;
}

/** Normalizes the form state: "every continent" is stored as [] and "All" questions as the eligible count. */
export function resolveSettings(
  mode: QuizMode,
  selected: Continent[],
  count: number | 'all',
  timerSeconds: number,
): QuizSettings {
  const continents = selected.length === CONTINENTS.length ? [] : selected;
  const available = filterByContinents(COUNTRIES, continents).length;
  const questionCount = count === 'all' ? available : Math.min(count, available);
  return { mode, continents, questionCount, timerSeconds };
}

export function SetupScreen({ initial, onStart, playerName, onPlayerNameChange, onShowScoreboard }: Props) {
  const [mode, setMode] = useState<QuizMode>(initial.mode);
  const [selected, setSelected] = useState<Continent[]>(
    initial.continents.length ? initial.continents : [...CONTINENTS],
  );
  const [count, setCount] = useState<number | 'all'>(
    (COUNT_OPTIONS as readonly number[]).includes(initial.questionCount) ? initial.questionCount : 'all',
  );
  const [timerSeconds, setTimerSeconds] = useState(initial.timerSeconds);

  const toggleContinent = (continent: Continent) =>
    setSelected((prev) =>
      prev.includes(continent)
        ? prev.filter((c) => c !== continent)
        : CONTINENTS.filter((c) => c === continent || prev.includes(c)),
    );

  const canStart = selected.length > 0;
  const settings = resolveSettings(mode, selected, count, timerSeconds);
  const best = canStart ? loadBest(settings) : null;

  return (
    <form
      className="card setup"
      onSubmit={(e) => {
        e.preventDefault();
        if (canStart) onStart(settings);
      }}
    >
      {onShowScoreboard && (
        <fieldset>
          <legend>
            <label htmlFor="player-name">Player name</label>
          </legend>
          <input
            id="player-name"
            className="text-input"
            value={playerName}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="nickname"
            placeholder="Optional: shown on the scoreboard"
            onChange={(e) => onPlayerNameChange(e.target.value)}
          />
        </fieldset>
      )}

      <fieldset>
        <legend>Mode</legend>
        <div className="segmented">
          <label>
            <input type="radio" name="mode" checked={mode === 'capital'} onChange={() => setMode('capital')} />
            <span>Country → Capital</span>
          </label>
          <label>
            <input type="radio" name="mode" checked={mode === 'country'} onChange={() => setMode('country')} />
            <span>Capital → Country</span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>
          Continents
          <button
            type="button"
            className="link"
            onClick={() => setSelected(selected.length === CONTINENTS.length ? [] : [...CONTINENTS])}
          >
            {selected.length === CONTINENTS.length ? 'Clear' : 'Select all'}
          </button>
        </legend>
        <div className="chips">
          {CONTINENTS.map((continent) => (
            <label key={continent} className="chip">
              <input
                type="checkbox"
                checked={selected.includes(continent)}
                onChange={() => toggleContinent(continent)}
              />
              <span>{continent}</span>
            </label>
          ))}
        </div>
        {!canStart && <p className="hint error">Pick at least one continent.</p>}
      </fieldset>

      <fieldset>
        <legend>Questions</legend>
        <div className="segmented">
          {[...COUNT_OPTIONS, 'all' as const].map((option) => (
            <label key={option}>
              <input type="radio" name="count" checked={count === option} onChange={() => setCount(option)} />
              <span>{option === 'all' ? 'All' : option}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Timer per question</legend>
        <div className="segmented">
          {TIMER_OPTIONS.map((option) => (
            <label key={option}>
              <input
                type="radio"
                name="timer"
                checked={timerSeconds === option}
                onChange={() => setTimerSeconds(option)}
              />
              <span>{option === 0 ? 'Off' : `${option}s`}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="setup-footer">
        <p className="hint">
          {canStart ? `${settings.questionCount} questions` : '—'}
          {best && ` · Best: ${best.correct}/${best.total} in ${formatDuration(best.timeMs)}`}
        </p>
        <div className="setup-buttons">
          {onShowScoreboard && (
            <button
              type="button"
              className="secondary"
              disabled={!canStart}
              onClick={() => onShowScoreboard(settings)}
            >
              Scoreboard
            </button>
          )}
          <button type="submit" className="primary" disabled={!canStart}>
            Start quiz
          </button>
        </div>
      </div>
    </form>
  );
}
