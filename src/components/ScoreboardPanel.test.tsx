import { fireEvent, render, screen, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { ScoreboardPanel } from './ScoreboardPanel';

const config = { url: 'https://abc.supabase.co', key: 'sb_publishable_test' };
const score = { correct: 9, total: 10, timeMs: 20_000 };
const board = [
  { player_name: 'Grace', correct: 10, total: 10, time_ms: 30_000 },
  { player_name: 'ada', correct: 9, total: 10, time_ms: 20_000 },
];

/** Fake Supabase: records posts, serves `board` for leaderboard reads. */
function fakeServer({ failPost = false } = {}) {
  const posts: unknown[] = [];
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      posts.push(JSON.parse(String(init.body)));
      return new Response(null, { status: failPost ? 500 : 201 });
    }
    return new Response(JSON.stringify(board), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { posts, fetchMock };
}

function renderPanel(playerName: string, onPlayerNameChange = vi.fn()) {
  render(
    <StrictMode>
      <ScoreboardPanel
        config={config}
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

afterEach(() => vi.unstubAllGlobals());

describe('ScoreboardPanel', () => {
  it('posts once for a registered player and highlights their row', async () => {
    const { posts } = fakeServer();
    renderPanel('Ada');

    expect(await screen.findByText(/Score posted as/)).toBeInTheDocument();
    expect(posts).toEqual([{ player_name: 'Ada', category: 'capital:all:10:15', correct: 9, total: 10, time_ms: 20000 }]);

    const rows = await screen.findAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('Grace')).toBeInTheDocument();
    expect(rows[1]).toHaveClass('me'); // "ada" matches "Ada" case-insensitively
  });

  it('asks for a name when none is registered, then posts with it', async () => {
    const { posts } = fakeServer();
    const onPlayerNameChange = renderPanel('');

    await screen.findAllByRole('listitem'); // board loads without posting
    expect(posts).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Post score' }));
    expect(screen.getByText(/Enter a name/)).toBeInTheDocument();
    expect(posts).toEqual([]);

    fireEvent.change(screen.getByLabelText(/Add your name/), { target: { value: '  Linus  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post score' }));
    expect(onPlayerNameChange).toHaveBeenCalledWith('Linus');
    expect(await screen.findByText(/Score posted as/)).toHaveTextContent('Score posted as Linus.');
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ player_name: 'Linus' });
  });

  it('offers a retry when posting fails', async () => {
    fakeServer({ failPost: true });
    renderPanel('Ada');
    expect(await screen.findByText(/Couldn't post your score/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/Couldn't post your score/)).toBeInTheDocument();
    expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(2);
  });
});
