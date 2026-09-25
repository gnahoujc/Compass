import { fireEvent, render, screen } from '@testing-library/react';
import type { AuthClient } from '../lib/auth';
import { LoginScreen } from './LoginScreen';

function fakeAuth(error: { code: string; status: number } | null = null) {
  const signInWithOtp = vi.fn().mockResolvedValue({ data: {}, error });
  return { auth: { signInWithOtp } as unknown as AuthClient, signInWithOtp };
}

const typeEmail = (value: string) => fireEvent.change(screen.getByLabelText('Email'), { target: { value } });
const submit = () => fireEvent.click(screen.getByRole('button', { name: /sign-in link/ }));

describe('LoginScreen', () => {
  it('sends a sign-in link and says to check the inbox', async () => {
    const { auth, signInWithOtp } = fakeAuth();
    render(<LoginScreen auth={auth} redirectTo="http://localhost:5173/" />);

    typeEmail('  player@example.com ');
    submit();

    expect(await screen.findByRole('heading', { name: 'Check your inbox' })).toBeInTheDocument();
    expect(screen.getByText('player@example.com')).toBeInTheDocument();
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'player@example.com',
      options: { shouldCreateUser: false, emailRedirectTo: 'http://localhost:5173/' },
    });
  });

  it('gives an uninvited address the same answer as an invited one', async () => {
    const { auth } = fakeAuth({ code: 'signup_disabled', status: 422 });
    render(<LoginScreen auth={auth} redirectTo="http://localhost:5173/" />);
    typeEmail('stranger@example.com');
    submit();
    expect(await screen.findByRole('heading', { name: 'Check your inbox' })).toBeInTheDocument();
  });

  it('rejects an invalid address without contacting the server', () => {
    const { auth, signInWithOtp } = fakeAuth();
    render(<LoginScreen auth={auth} redirectTo="http://localhost:5173/" />);
    typeEmail('not-an-email');
    submit();
    expect(screen.getByRole('alert')).toHaveTextContent(/valid email/);
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it('shows rate limiting as an error', async () => {
    const { auth } = fakeAuth({ code: 'over_email_send_rate_limit', status: 429 });
    render(<LoginScreen auth={auth} redirectTo="http://localhost:5173/" />);
    typeEmail('player@example.com');
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(/Too many/);
  });

  it('shows an expired-link message passed in at startup', () => {
    const { auth } = fakeAuth();
    render(<LoginScreen auth={auth} initialError="That sign-in link has expired or was already used." />);
    expect(screen.getByRole('alert')).toHaveTextContent(/expired/);
  });
});
