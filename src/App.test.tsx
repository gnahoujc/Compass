import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { fakeSupabase, storeTestSession } from './test/fakeSupabase';

beforeEach(() => localStorage.clear());

describe('App sign-in gate', () => {
  it('shows only the login screen when signed out', async () => {
    const { client } = fakeSupabase();
    render(<App client={client} />);

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start quiz' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
  });

  it('shows the game, the email and a sign-out button when signed in', async () => {
    storeTestSession('user-1');
    const { client } = fakeSupabase();
    render(<App client={client} />);

    expect(await screen.findByRole('button', { name: 'Start quiz' })).toBeInTheDocument();
    expect(screen.getByText(/Signed in as/)).toHaveTextContent('Signed in as player@example.com');
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('signs out back to the login screen', async () => {
    storeTestSession('user-1');
    const { client, requests } = fakeSupabase((req) => (req.url.pathname === '/auth/v1/logout' ? { status: 204 } : undefined));
    render(<App client={client} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start quiz' })).not.toBeInTheDocument();
    expect(requests.some((r) => r.url.pathname === '/auth/v1/logout')).toBe(true);
    expect(Object.keys(localStorage).filter((k) => k.includes('auth-token'))).toEqual([]);
  });

  it('explains when the build has no Supabase settings', () => {
    render(<App client={null} />);
    expect(screen.getByRole('heading', { name: "Sign-in isn't configured" })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start quiz' })).not.toBeInTheDocument();
  });
});
