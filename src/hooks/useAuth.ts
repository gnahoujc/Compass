import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import type { AuthClient } from '../lib/auth';

export type AuthState = { status: 'loading' } | { status: 'signed-out' } | { status: 'signed-in'; session: Session };

/** Tracks the Supabase session: restored from storage, from a magic link in the URL, and on sign-in/out. */
export function useAuth(auth: AuthClient): AuthState {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    const apply = (session: Session | null) => {
      if (active) setState(session ? { status: 'signed-in', session } : { status: 'signed-out' });
    };

    auth.getSession().then(({ data }) => apply(data.session), () => apply(null));
    const { data } = auth.onAuthStateChange((_event, session) => apply(session));

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [auth]);

  return state;
}
