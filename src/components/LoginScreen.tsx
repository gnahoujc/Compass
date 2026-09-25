import { useState, type FormEvent } from 'react';
import { appUrl, sendMagicLink, type AuthClient, type MagicLinkResult } from '../lib/auth';

interface Props {
  auth: AuthClient;
  /** Message about a sign-in link that failed (e.g. expired), read from the URL at startup. */
  initialError?: string | null;
  /** Where the emailed link leads; defaults to this app's URL. */
  redirectTo?: string;
}

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; email: string } | { kind: 'error'; message: string };

const ERROR_MESSAGES: Record<Exclude<MagicLinkResult, { ok: true }>['reason'], string> = {
  'invalid-email': "That doesn't look like a valid email address.",
  'rate-limited': 'Too many sign-in emails were requested. Please wait a few minutes and try again.',
  'email-not-authorized': "Sign-in emails can't be sent to this address yet. Please contact the site owner.",
  failed: "Couldn't send the sign-in email. Please try again.",
};

// Deliberately loose: the server does the real validation.
const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export function LoginScreen({ auth, initialError = null, redirectTo }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>(initialError ? { kind: 'error', message: initialError } : { kind: 'idle' });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!looksLikeEmail(address)) {
      setStatus({ kind: 'error', message: ERROR_MESSAGES['invalid-email'] });
      return;
    }
    setStatus({ kind: 'sending' });
    const result = await sendMagicLink(auth, address, redirectTo ?? appUrl());
    setStatus(result.ok ? { kind: 'sent', email: address } : { kind: 'error', message: ERROR_MESSAGES[result.reason] });
  };

  if (status.kind === 'sent') {
    return (
      <section className="card login" aria-labelledby="login-title">
        <h2 id="login-title">Check your inbox</h2>
        <p>
          If <strong>{status.email}</strong> has been invited to Compass, a sign-in link is on its way. Open it to
          start playing.
        </p>
        <p className="hint">Nothing after a few minutes? Check your spam folder, or ask the site owner for an invitation.</p>
        <button type="button" className="secondary" onClick={() => setStatus({ kind: 'idle' })}>
          Use a different email
        </button>
      </section>
    );
  }

  return (
    <form className="card login" aria-labelledby="login-title" onSubmit={submit} noValidate>
      <h2 id="login-title">Sign in</h2>
      <p className="hint">Compass is invite-only. Enter your email and we'll send you a sign-in link; no password needed.</p>
      <label htmlFor="login-email">Email</label>
      <input
        id="login-email"
        className="text-input"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={status.kind === 'error'}
        aria-describedby={status.kind === 'error' ? 'login-error' : undefined}
      />
      {status.kind === 'error' && (
        <p id="login-error" className="hint error" role="alert">
          {status.message}
        </p>
      )}
      <button type="submit" className="primary" disabled={status.kind === 'sending'}>
        {status.kind === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
      </button>
    </form>
  );
}
