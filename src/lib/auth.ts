import type { SupabaseClient } from '@supabase/supabase-js';

/** Only the parts of the Supabase auth client the app uses, so tests can fake it. */
export type AuthClient = Pick<SupabaseClient['auth'], 'getSession' | 'onAuthStateChange' | 'signInWithOtp' | 'signOut'>;

export type MagicLinkResult =
  | { ok: true }
  | { ok: false; reason: 'invalid-email' | 'rate-limited' | 'email-not-authorized' | 'failed' };

/**
 * Where magic links send the user back to: the page they are on (without query
 * or hash), i.e. http://localhost:5173/ in development and
 * https://gnahoujc.github.io/Compass/ on GitHub Pages.
 */
export function appUrl(location: Pick<Location, 'origin' | 'pathname'> = window.location): string {
  return location.origin + location.pathname;
}

/**
 * Emails a sign-in link. `shouldCreateUser: false` means only existing
 * (invited) users can sign in. For any other address the result is still
 * `ok`, so the login screen never reveals who has been invited.
 */
export async function sendMagicLink(auth: AuthClient, email: string, redirectTo: string): Promise<MagicLinkResult> {
  const { error } = await auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
  });
  if (!error) return { ok: true };

  const code = 'code' in error ? error.code : undefined;
  switch (code) {
    case 'signup_disabled':
    case 'otp_disabled':
    case 'user_not_found':
      return { ok: true };
    case 'email_address_invalid':
    case 'validation_failed':
      return { ok: false, reason: 'invalid-email' };
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return { ok: false, reason: 'rate-limited' };
    case 'email_address_not_authorized':
      // Supabase's built-in email service only mails the project's team; see README.
      return { ok: false, reason: 'email-not-authorized' };
  }
  if (error.status === 429) return { ok: false, reason: 'rate-limited' };
  return { ok: false, reason: 'failed' };
}

/**
 * A failed sign-in link comes back as e.g. `#error=access_denied&error_code=otp_expired`.
 * Returns a message for the login screen (or null) and removes the error from the URL.
 */
export function takeAuthError(location: Pick<Location, 'hash' | 'pathname' | 'search'> = window.location, history: Pick<History, 'replaceState'> = window.history): string | null {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  if (!params.has('error') && !params.has('error_code')) return null;
  history.replaceState(null, '', location.pathname + location.search);
  return params.get('error_code') === 'otp_expired'
    ? 'That sign-in link has expired or was already used. Request a new one below.'
    : "That sign-in link didn't work. Request a new one below.";
}
