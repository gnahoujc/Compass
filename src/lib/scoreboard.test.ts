import { fetchLeaderboard, ScoreboardError, scoreboardConfig, submitScore } from './scoreboard';

const config = { url: 'https://abc.supabase.co', key: 'sb_publishable_test' };
const ok = (body: unknown = null) => new Response(body === null ? null : JSON.stringify(body), { status: body === null ? 201 : 200 });

describe('scoreboardConfig', () => {
  it('is off without a URL or key', () => {
    expect(scoreboardConfig(undefined, 'k')).toBeNull();
    expect(scoreboardConfig('https://abc.supabase.co', '')).toBeNull();
  });

  it('strips trailing slashes from the URL', () => {
    expect(scoreboardConfig('https://abc.supabase.co/', 'k')).toEqual({ url: 'https://abc.supabase.co', key: 'k' });
  });
});

describe('submitScore', () => {
  it('posts the score in the table format', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok());
    await submitScore(config, { playerName: 'Ada', category: 'capital:all:10:15', correct: 9, total: 10, timeMs: 20_400.6 }, fetchMock);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://abc.supabase.co/rest/v1/scores');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ apikey: 'sb_publishable_test', 'Content-Type': 'application/json' });
    expect(init.headers.Authorization).toBeUndefined();
    expect(JSON.parse(init.body)).toEqual({
      player_name: 'Ada',
      category: 'capital:all:10:15',
      correct: 9,
      total: 10,
      time_ms: 20401,
    });
  });

  it('also sends a legacy JWT key as a bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok());
    await submitScore({ ...config, key: 'eyJhbGciOi.test' }, { playerName: 'A', category: 'c', correct: 1, total: 1, timeMs: 1 }, fetchMock);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer eyJhbGciOi.test');
  });

  it('throws when the server rejects the score', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 400 }));
    await expect(
      submitScore(config, { playerName: 'A', category: 'c', correct: 1, total: 1, timeMs: 1 }, fetchMock),
    ).rejects.toBeInstanceOf(ScoreboardError);
  });
});

describe('fetchLeaderboard', () => {
  it('queries the top 10 for a category and maps the rows', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok([{ player_name: 'Ada', correct: 9, total: 10, time_ms: 20000 }]));
    const rows = await fetchLeaderboard(config, 'country:North America,South America:10:0', fetchMock);

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://abc.supabase.co/rest/v1/leaderboard');
    expect(url.searchParams.get('category')).toBe('eq.country:North America,South America:10:0');
    expect(url.searchParams.get('order')).toBe('correct.desc,time_ms.asc');
    expect(url.searchParams.get('limit')).toBe('10');
    expect(rows).toEqual([{ playerName: 'Ada', correct: 9, total: 10, timeMs: 20000 }]);
  });
});
