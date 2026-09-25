import { createSupabase } from '../lib/supabase';

/** One request as the real supabase-js client sent it. */
export interface RecordedRequest {
  method: string;
  url: URL;
  headers: Headers;
  body: unknown;
}

type Reply = { status: number; body?: unknown; headers?: Record<string, string> };
type Handler = (req: RecordedRequest) => Reply | undefined;

export const TEST_CONFIG = { url: 'https://abc.supabase.co', key: 'sb_publishable_test' };

/**
 * A real Supabase client whose network calls go to `handler` instead of the
 * internet, so tests see the exact HTTP requests the app makes.
 */
export function fakeSupabase(handler: Handler = () => undefined) {
  const requests: RecordedRequest[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    const raw = init?.body;
    const req: RecordedRequest = {
      method: (init?.method ?? 'GET').toUpperCase(),
      url,
      headers: new Headers(init?.headers),
      body: typeof raw === 'string' && raw ? JSON.parse(raw) : raw,
    };
    requests.push(req);
    const reply = handler(req) ?? { status: 200, body: [] };
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
      status: reply.status,
      headers: { 'Content-Type': 'application/json', 'x-supabase-api-version': '2024-01-01', ...reply.headers },
    });
  }) as typeof fetch;

  return { client: createSupabase(TEST_CONFIG, fetchImpl), requests };
}

/**
 * Stores a signed-in session where supabase-js looks for it, so a client
 * created afterwards acts as that user without any network call.
 */
export function storeTestSession(userId = 'user-1', accessToken = 'test-access-token') {
  const ref = new URL(TEST_CONFIG.url).hostname.split('.')[0];
  localStorage.setItem(
    `sb-${ref}-auth-token`,
    JSON.stringify({
      access_token: accessToken,
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, email: 'player@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
    }),
  );
}
