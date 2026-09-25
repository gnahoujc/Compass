import { fakeSupabase, storeTestSession } from '../test/fakeSupabase';
import { fetchLeaderboard, ScoreboardError, submitScore } from './scoreboard';
import { supabaseConfig } from './supabase';

const entry = { playerName: 'Ada', category: 'capital:all:10:15', correct: 9, total: 10, timeMs: 20_400.6 };

beforeEach(() => localStorage.clear());

describe('supabaseConfig', () => {
  it('is off without a URL or key', () => {
    expect(supabaseConfig('', 'k')).toBeNull();
    expect(supabaseConfig('https://abc.supabase.co', '')).toBeNull();
  });

  it('strips trailing slashes from the URL', () => {
    expect(supabaseConfig('https://abc.supabase.co/', 'k')).toEqual({ url: 'https://abc.supabase.co', key: 'k' });
  });
});

describe('submitScore', () => {
  it('inserts the score without a user_id, as the signed-in user', async () => {
    storeTestSession('user-1', 'token-for-user-1');
    const { client, requests } = fakeSupabase((req) => (req.method === 'POST' ? { status: 201 } : undefined));

    await submitScore(client, entry);

    const post = requests.find((r) => r.method === 'POST')!;
    expect(post.url.pathname).toBe('/rest/v1/scores');
    // The database fills user_id from the session and rejects any other value.
    expect(post.body).toEqual({ player_name: 'Ada', category: 'capital:all:10:15', correct: 9, total: 10, time_ms: 20401 });
    expect(post.headers.get('Authorization')).toBe('Bearer token-for-user-1');
    expect(post.headers.get('apikey')).toBe('sb_publishable_test');
  });

  it('throws when the database rejects the score', async () => {
    const { client } = fakeSupabase(() => ({
      status: 403,
      body: { code: '42501', message: 'new row violates row-level security policy for table "scores"' },
    }));
    await expect(submitScore(client, entry)).rejects.toBeInstanceOf(ScoreboardError);
  });
});

describe('fetchLeaderboard', () => {
  it('queries the top 10 for a category and maps the rows', async () => {
    const { client, requests } = fakeSupabase(() => ({
      status: 200,
      body: [{ user_id: 'user-1', player_name: 'Ada', correct: 9, total: 10, time_ms: 20000 }],
    }));

    const rows = await fetchLeaderboard(client, 'country:North America,South America:10:0');

    const { url } = requests[0];
    expect(url.pathname).toBe('/rest/v1/leaderboard');
    expect(url.searchParams.get('select')).toBe('user_id,player_name,correct,total,time_ms');
    expect(url.searchParams.get('category')).toBe('eq.country:North America,South America:10:0');
    expect(url.searchParams.get('order')).toBe('correct.desc,time_ms.asc');
    expect(url.searchParams.get('limit')).toBe('10');
    expect(rows).toEqual([{ userId: 'user-1', playerName: 'Ada', correct: 9, total: 10, timeMs: 20000 }]);
  });

  it('throws when access is denied', async () => {
    const { client } = fakeSupabase(() => ({ status: 401, body: { code: '42501', message: 'permission denied for view leaderboard' } }));
    await expect(fetchLeaderboard(client, 'capital:all:10:15')).rejects.toBeInstanceOf(ScoreboardError);
  });
});
