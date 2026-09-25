import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase project settings, fixed at build time (VITE_SUPABASE_URL and
 * VITE_SUPABASE_KEY; see .env.example). Sign-in and the scoreboard need both.
 */
export interface SupabaseConfig {
  url: string;
  /** The project's public ("publishable" or legacy "anon") key; safe to ship to browsers. */
  key: string;
}

export function supabaseConfig(
  url: string | undefined = import.meta.env.VITE_SUPABASE_URL,
  key: string | undefined = import.meta.env.VITE_SUPABASE_KEY,
): SupabaseConfig | null {
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ''), key };
}

export function createSupabase(config: SupabaseConfig, fetchImpl?: typeof fetch): SupabaseClient {
  return createClient(config.url, config.key, {
    auth: {
      // Magic links and dashboard invites return the session in the URL hash.
      // PKCE would reject dashboard invites (they have no code verifier) and
      // links opened in a different browser than the one that requested them.
      flowType: 'implicit',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: fetchImpl ? { fetch: fetchImpl } : undefined,
  });
}
