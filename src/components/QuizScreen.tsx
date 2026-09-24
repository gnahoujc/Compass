import { useCallback, useEffect, useRef, useState } from 'react';
import { useTimer } from '../hooks/useTimer';
import type { AnswerRecord, Question, QuizSettings } from '../types';
import { ChoiceButton, type ChoiceState } from './ChoiceButton';
import { Flag } from './Flag';

interface Props {
  questions: Question[];
  settings: QuizSettings;
  onFinish: (records: AnswerRecord[], timeMs: number) => void;
  onQuit: () => void;
}

export function QuizScreen({ questions, settings, onFinish, onQuit }: Props) {
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [current, setCurrent] = useState<AnswerRecord | null>(null);
  const questionStartedAt = useRef(Date.now());
  const elapsedMs = useRef(0);
  const nextButton = useRef<HTMLButtonElement>(null);

  const question = questions[index];
  const answered = current !== null;
  const score = records.filter((r) => r.correct).length + (current?.correct ? 1 : 0);

  const answer = useCallback(
    (selected: string | null) => {
      if (answered) return;
      elapsedMs.current += Date.now() - questionStartedAt.current;
      setCurrent({ question, selected, correct: selected === question.answer });
    },
    [answered, question],
  );

  const advance = useCallback(() => {
    if (!current) return;
    const nextRecords = [...records, current];
    if (index + 1 >= questions.length) {
      onFinish(nextRecords, elapsedMs.current);
      return;
    }
    setRecords(nextRecords);
    setCurrent(null);
    setIndex(index + 1);
    questionStartedAt.current = Date.now();
  }, [current, records, index, questions.length, onFinish]);

  const timer = useTimer(settings.timerSeconds, !answered, index, () => answer(null));

  // The quiz waits on the feedback until the player moves on. Focusing "Next"
  // lets keyboard users continue with Enter/Space; the answered choice button
  // is disabled by now, so focus would otherwise be lost.
  useEffect(() => {
    if (answered) nextButton.current?.focus();
  }, [answered]);

  // Keyboard: 1–4 to answer, Enter/Space to go to the next question.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const n = Number(e.key);
      if (!answered && n >= 1 && n <= question.choices.length) {
        answer(question.choices[n - 1]);
      } else if (answered && (e.key === 'Enter' || e.key === ' ')) {
        // Let a focused button handle the key itself: "Next" advances anyway,
        // and "Quit" should quit rather than advance.
        if (e.target instanceof HTMLButtonElement) return;
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, question, answer, advance]);

  const stateFor = (choice: string): ChoiceState => {
    if (!current) return 'idle';
    if (choice === question.answer) return 'correct';
    if (choice === current.selected) return 'wrong';
    return 'dimmed';
  };

  const secondsLeft = Math.ceil(timer.remainingMs / 1000);

  return (
    <section className="card quiz" aria-labelledby="question">
      <header className="quiz-header">
        <span>
          Question {index + 1} / {questions.length}
        </span>
        <span>Score {score}</span>
        <button type="button" className="link" onClick={onQuit}>
          Quit
        </button>
      </header>

      <div className="progress" aria-hidden="true">
        <div style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

      {timer.enabled && (
        <div
          className={`timer ${secondsLeft <= 3 && !answered ? 'timer-low' : ''}`}
          role="timer"
          aria-label={`${secondsLeft} seconds left`}
        >
          <div className="timer-bar" style={{ width: `${timer.fraction * 100}%` }} />
          <span>{secondsLeft}s</span>
        </div>
      )}

      <p className="continent-tag">{question.country.continent}</p>
      <h2 id="question" className="prompt">
        {question.prompt}
      </h2>

      {/* Keyed by question so buttons never carry over (and animate out of) the previous question's state. */}
      <div className="choices" key={index}>
        {question.choices.map((choice, i) => (
          <ChoiceButton
            key={choice}
            label={choice}
            shortcut={i + 1}
            state={stateFor(choice)}
            disabled={answered}
            onSelect={() => answer(choice)}
          />
        ))}
      </div>

      <div className="feedback" aria-live="polite">
        {current && (
          <>
            <Flag country={question.country} />
            <div className="feedback-text">
              {current.correct ? (
                <p className="feedback-correct">Correct!</p>
              ) : (
                <p className="feedback-wrong">
                  {current.selected === null ? "Time's up! " : 'Not quite. '}
                  The answer is <strong>{question.answer}</strong>.
                </p>
              )}
              <p className="feedback-detail">
                {question.country.capital} is the capital of {question.country.name}.
              </p>
            </div>
            <button ref={nextButton} type="button" className="secondary" onClick={advance}>
              {index + 1 >= questions.length ? 'See results' : 'Next'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
