import { fireEvent, render, screen, within } from '@testing-library/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { StrictMode } from 'react';
import { fakeSupabase, storeTestSession } from '../test/fakeSupabase';
import { ScoreboardPanel } from './ScoreboardPanel';

const score = { correct: 9, total: 10, timeMs: 20_000 };
const board = [
  { user_id: 'user-2', player_name: 'Grace', correct: 10, total: 10, time_ms: 30_000 },
  // Same display name as the signed-in player, but a different account: not highlighted.
  { user_id: 'user-3', player_name: 'Ada', correct: 9, total: 10, time_ms: 25_000 },
  { user_id: 'user-1', player_name: 'Ada', correct: 9, total: 10, time_ms: 20_000 },
];

/** Real Supabase client against a fake server: records inserts, serves `board`. */
function fakeServer({ failPost = false } = {}) {
  storeTestSession('user-1');
  const { client, requests } = fakeSupabase((req) =>
    req.method === 'POST'
      ? failPost
        ? { status: 500, body: { message: 'boom' } }
        : { status: 201 }
      : { status: 200, body: board },
  );
  const posts = () => requests.filter((r) => r.method === 'POST').map((r) => r.body);
  return { client, posts };
}

function renderPanel(client: SupabaseClient, playerName: string, onPlayerNameChange = vi.fn()) {
  render(
    <StrictMode>
      <ScoreboardPanel
        client={client}
        currentUserId="user-1"
        category="capital:all:10:15"
        label="Country → Capital · All continents · 10 questions · 15s per question"
        score={score}
        playerName={playerName}
        onPlayerNameChange={onPlayerNameChange}
      />
    </StrictMode>,
  );
  return onPlayerNameChange;
}

beforeEach(() => localStorage.clear());

describe('ScoreboardPanel', () => {
  it('posts once for a registered player and highlights their own account', async () => {
    const { client, posts } = fakeServer();
    renderPanel(client, 'Ada');

    expect(await screen.findByText(/Score posted as/)).toBeInTheDocument();
    expect(posts()).toEqual([{ player_name: 'Ada', category: 'capital:all:10:15', correct: 9, total: 10, time_ms: 20000 }]);

    const rows = await screen.findAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText('Grace')).toBeInTheDocument();
    expect(rows.map((r) => r.classList.contains('me'))).toEqual([false, false, true]);
  });

  it('asks for a name when none is registered, then posts with it', async () => {
    const { client, posts } = fakeServer();
    const onPlayerNameChange = renderPanel(client, '');

    await screen.findAllByRole('listitem'); // board loads without posting
    expect(posts()).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Post score' }));
    expect(screen.getByText(/Enter a name/)).toBeInTheDocument();
    expect(posts()).toEqual([]);

    fireEvent.change(screen.getByLabelText(/Add your name/), { target: { value: '  Linus  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post score' }));
    expect(onPlayerNameChange).toHaveBeenCalledWith('Linus');
    expect(await screen.findByText(/Score posted as/)).toHaveTextContent('Score posted as Linus.');
    expect(posts()).toHaveLength(1);
    expect(posts()[0]).toMatchObject({ player_name: 'Linus' });
  });

  it('offers a retry when posting fails', async () => {
    const { client, posts } = fakeServer({ failPost: true });
    renderPanel(client, 'Ada');
    expect(await screen.findByText(/Couldn't post your score/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await vi.waitFor(() => expect(posts()).toHaveLength(2));
    expect(await screen.findByText(/Couldn't post your score/)).toBeInTheDocument();
  });
});
