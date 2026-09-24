import { useState } from 'react';
import { QuizScreen } from './components/QuizScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { SetupScreen } from './components/SetupScreen';
import { COUNTRIES } from './data/countries';
import { buildQuestions } from './lib/quiz';
import { loadBest, saveIfBest, type BestScore } from './lib/scores';
import type { AnswerRecord, Question, QuizSettings } from './types';

type Screen =
  | { name: 'setup' }
  | { name: 'quiz'; questions: Question[] }
  | { name: 'results'; records: AnswerRecord[]; timeMs: number; isNewBest: boolean; best: BestScore | null };

const DEFAULT_SETTINGS: QuizSettings = { mode: 'capital', continents: [], questionCount: 10, timerSeconds: 15 };

export default function App() {
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);
  const [screen, setScreen] = useState<Screen>({ name: 'setup' });
  const [round, setRound] = useState(0);

  const start = (next: QuizSettings) => {
    setSettings(next);
    setRound((r) => r + 1);
    setScreen({ name: 'quiz', questions: buildQuestions(COUNTRIES, next) });
  };

  const finish = (records: AnswerRecord[], timeMs: number) => {
    const score: BestScore = {
      correct: records.filter((r) => r.correct).length,
      total: records.length,
      timeMs,
      date: new Date().toISOString(),
    };
    const isNewBest = saveIfBest(settings, score);
    setScreen({ name: 'results', records, timeMs, isNewBest, best: loadBest(settings) });
  };

  return (
    <div className="app">
      <header className="app-header">
        <img src={`${import.meta.env.BASE_URL}compass.svg`} alt="" width={40} height={40} />
        <div>
          <h1>Compass</h1>
          <p>How well do you know the world's capitals?</p>
        </div>
      </header>

      <main>
        {screen.name === 'setup' && <SetupScreen initial={settings} onStart={start} />}
        {screen.name === 'quiz' && (
          <QuizScreen
            // A fresh key per round resets all quiz state on "Play again".
            key={round}
            questions={screen.questions}
            settings={settings}
            onFinish={finish}
            onQuit={() => setScreen({ name: 'setup' })}
          />
        )}
        {screen.name === 'results' && (
          <ResultsScreen
            records={screen.records}
            timeMs={screen.timeMs}
            isNewBest={screen.isNewBest}
            best={screen.best}
            onPlayAgain={() => start(settings)}
            onChangeSettings={() => setScreen({ name: 'setup' })}
          />
        )}
      </main>
    </div>
  );
}
