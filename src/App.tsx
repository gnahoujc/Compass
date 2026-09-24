import { useState } from 'react';
import { describeSettings } from './components/format';
import { QuizScreen } from './components/QuizScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { ScoreboardPanel } from './components/ScoreboardPanel';
import { ScoreboardScreen } from './components/ScoreboardScreen';
import { SetupScreen } from './components/SetupScreen';
import { COUNTRIES } from './data/countries';
import { loadPlayerName, savePlayerName } from './lib/player';
import { buildQuestions } from './lib/quiz';
import { scoreboardConfig } from './lib/scoreboard';
import { categoryKey, loadBest, saveIfBest, type BestScore } from './lib/scores';
import type { AnswerRecord, Question, QuizSettings } from './types';

type Screen =
  | { name: 'setup' }
  | { name: 'scoreboard' }
  | { name: 'quiz'; questions: Question[] }
  | { name: 'results'; records: AnswerRecord[]; score: BestScore; isNewBest: boolean; best: BestScore | null };

const DEFAULT_SETTINGS: QuizSettings = { mode: 'capital', continents: [], questionCount: 10, timerSeconds: 15 };

/** Online scoreboard settings, fixed at build time; null turns the scoreboard off. */
const SCOREBOARD = scoreboardConfig();

export default function App() {
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);
  const [screen, setScreen] = useState<Screen>({ name: 'setup' });
  const [round, setRound] = useState(0);
  const [playerName, setPlayerName] = useState(loadPlayerName);

  const changePlayerName = (name: string) => {
    setPlayerName(name);
    savePlayerName(name.trim());
  };

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
    setScreen({ name: 'results', records, score, isNewBest, best: loadBest(settings) });
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
        {screen.name === 'setup' && (
          <SetupScreen
            initial={settings}
            onStart={start}
            playerName={playerName}
            onPlayerNameChange={changePlayerName}
            onShowScoreboard={
              SCOREBOARD
                ? (next) => {
                    // Remember the choices so "Back" returns to the same settings.
                    setSettings(next);
                    setScreen({ name: 'scoreboard' });
                  }
                : undefined
            }
          />
        )}
        {screen.name === 'scoreboard' && SCOREBOARD && (
          <ScoreboardScreen
            config={SCOREBOARD}
            settings={settings}
            playerName={playerName}
            onBack={() => setScreen({ name: 'setup' })}
          />
        )}
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
            timeMs={screen.score.timeMs}
            isNewBest={screen.isNewBest}
            best={screen.best}
            onPlayAgain={() => start(settings)}
            onChangeSettings={() => setScreen({ name: 'setup' })}
          >
            {SCOREBOARD && (
              <ScoreboardPanel
                config={SCOREBOARD}
                category={categoryKey(settings)}
                label={describeSettings(settings)}
                score={screen.score}
                playerName={playerName}
                onPlayerNameChange={changePlayerName}
              />
            )}
          </ResultsScreen>
        )}
      </main>
    </div>
  );
}
