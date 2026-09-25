import { fakeSupabase } from '../test/fakeSupabase';
import { appUrl, sendMagicLink, takeAuthError } from './auth';

const REDIRECT = 'https://gnahoujc.github.io/Compass/';
const authError = (status: number, code: string) => () => ({ status, body: { code, msg: code } });

beforeEach(() => localStorage.clear());

describe('sendMagicLink', () => {
  it('asks for a link for existing users only, returning to the app', async () => {
    const { client, requests } = fakeSupabase(() => ({ status: 200, body: {} }));

    expect(await sendMagicLink(client.auth, 'player@example.com', REDIRECT)).toEqual({ ok: true });

    const otp = requests.find((r) => r.url.pathname === '/auth/v1/otp')!;
    expect(otp.method).toBe('POST');
    expect(otp.url.searchParams.get('redirect_to')).toBe(REDIRECT);
    expect(otp.body).toMatchObject({ email: 'player@example.com', create_user: false });
  });

  it.each(['signup_disabled', 'otp_disabled', 'user_not_found'])(
    'reports success for an uninvited address (%s) so invitations stay private',
    async (code) => {
      const { client } = fakeSupabase(authError(422, code));
      expect(await sendMagicLink(client.auth, 'stranger@example.com', REDIRECT)).toEqual({ ok: true });
    },
  );

  it.each([
    [429, 'over_email_send_rate_limit', 'rate-limited'],
    [429, 'over_request_rate_limit', 'rate-limited'],
    [400, 'email_address_invalid', 'invalid-email'],
    [400, 'email_address_not_authorized', 'email-not-authorized'],
    [400, 'something_else', 'failed'],
  ])('maps HTTP %i %s to %s', async (status, code, reason) => {
    const { client } = fakeSupabase(authError(status, code));
    expect(await sendMagicLink(client.auth, 'player@example.com', REDIRECT)).toEqual({ ok: false, reason });
  });
});

describe('appUrl', () => {
  it('is the current page without query or hash', () => {
    expect(appUrl({ origin: 'https://gnahoujc.github.io', pathname: '/Compass/' })).toBe('https://gnahoujc.github.io/Compass/');
    expect(appUrl({ origin: 'http://localhost:5173', pathname: '/' })).toBe('http://localhost:5173/');
  });
});

describe('takeAuthError', () => {
  const location = (hash: string) => ({ hash, pathname: '/Compass/', search: '' });

  it('explains an expired link and removes the error from the URL', () => {
    const history = { replaceState: vi.fn() };
    const message = takeAuthError(
      location('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'),
      history,
    );
    expect(message).toMatch(/expired/);
    expect(history.replaceState).toHaveBeenCalledWith(null, '', '/Compass/');
  });

  it('has a general message for other link errors', () => {
    expect(takeAuthError(location('#error=server_error'), { replaceState: vi.fn() })).toMatch(/didn't work/);
  });

  it('ignores normal URLs and successful sign-in tokens', () => {
    const history = { replaceState: vi.fn() };
    expect(takeAuthError(location(''), history)).toBeNull();
    expect(takeAuthError(location('#access_token=abc&refresh_token=def&type=magiclink'), history)).toBeNull();
    expect(history.replaceState).not.toHaveBeenCalled();
  });
});
