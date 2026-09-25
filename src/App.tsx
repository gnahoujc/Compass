import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { describeSettings } from './components/format';
import { LoginScreen } from './components/LoginScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { ScoreboardPanel } from './components/ScoreboardPanel';
import { ScoreboardScreen } from './components/ScoreboardScreen';
import { SetupScreen } from './components/SetupScreen';
import { COUNTRIES } from './data/countries';
import { useAuth } from './hooks/useAuth';
import { loadPlayerName, savePlayerName } from './lib/player';
import { buildQuestions } from './lib/quiz';
import { categoryKey, loadBest, saveIfBest, type BestScore } from './lib/scores';
import type { AnswerRecord, Question, QuizSettings } from './types';

type Screen =
  | { name: 'setup' }
  | { name: 'scoreboard' }
  | { name: 'quiz'; questions: Question[] }
  | { name: 'results'; records: AnswerRecord[]; score: BestScore; isNewBest: boolean; best: BestScore | null };

const DEFAULT_SETTINGS: QuizSettings = { mode: 'capital', continents: [], questionCount: 10, timerSeconds: 15 };

interface AppProps {
  /** Supabase client, or null when the build has no Supabase settings. */
  client: SupabaseClient | null;
  /** Message about a sign-in link that failed, read from the URL at startup. */
  initialAuthError?: string | null;
}

export default function App({ client, initialAuthError = null }: AppProps) {
  return (
    <div className="app">
      <header className="app-header">
        <img src={`${import.meta.env.BASE_URL}compass.svg`} alt="" width={40} height={40} />
        <div>
          <h1>Compass</h1>
          <p>How well do you know the world's capitals?</p>
        </div>
      </header>
      {client ? (
        <AuthGate client={client} initialAuthError={initialAuthError} />
      ) : (
        <main>
          <section className="card">
            <h2>Sign-in isn't configured</h2>
            <p className="hint">
              This build has no Supabase settings. Set VITE_SUPABASE_URL and VITE_SUPABASE_KEY (see .env.example).
            </p>
          </section>
        </main>
      )}
    </div>
  );
}

/** Shows the login screen until there is a session, then the game. */
function AuthGate({ client, initialAuthError }: { client: SupabaseClient; initialAuthError: string | null }) {
  const auth = useAuth(client.auth);

  if (auth.status === 'loading') {
    return (
      <main>
        <p className="hint" role="status">
          Loading…
        </p>
      </main>
    );
  }
  if (auth.status === 'signed-out') {
    return (
      <main>
        <LoginScreen auth={client.auth} initialError={initialAuthError} />
      </main>
    );
  }
  return (
    <>
      <UserBar session={auth.session} onSignOut={() => void client.auth.signOut()} />
      <main>
        {/* Keyed by user so a different account never sees the previous one's screen state. */}
        <Game key={auth.session.user.id} client={client} userId={auth.session.user.id} />
      </main>
    </>
  );
}

function UserBar({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  return (
    <div className="user-bar">
      <span>
        Signed in as <strong>{session.user.email}</strong>
      </span>
      <button type="button" className="link" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}

function Game({ client, userId }: { client: SupabaseClient; userId: string }) {
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
    <>
      {screen.name === 'setup' && (
        <SetupScreen
          initial={settings}
          onStart={start}
          playerName={playerName}
          onPlayerNameChange={changePlayerName}
          onShowScoreboard={(next) => {
            // Remember the choices so "Back" returns to the same settings.
            setSettings(next);
            setScreen({ name: 'scoreboard' });
          }}
        />
      )}
      {screen.name === 'scoreboard' && (
        <ScoreboardScreen
          client={client}
          currentUserId={userId}
          settings={settings}
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
          <ScoreboardPanel
            client={client}
            currentUserId={userId}
            category={categoryKey(settings)}
            label={describeSettings(settings)}
            score={screen.score}
            playerName={playerName}
            onPlayerNameChange={changePlayerName}
          />
        </ResultsScreen>
      )}
    </>
  );
}
