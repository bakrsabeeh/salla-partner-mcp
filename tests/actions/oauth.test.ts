import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { TokenManager } from '../../src/token-manager.js';
import { OAuthActions } from '../../src/actions/oauth.js';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeOAuth(withToken = false) {
  const tokens = new TokenManager();
  if (withToken) tokens.setToken({ accessToken: 'tok', refreshToken: 'r123', expiresAt: Date.now() + 60_000 });
  return { tokens, oauth: new OAuthActions(tokens, 'client123', 'secret456') };
}

describe('OAuthActions', () => {
  it('get_oauth_url generates correct URL', () => {
    const { oauth } = makeOAuth();
    const result = oauth.getOAuthUrl(['offline_access', 'orders.read']);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.url).toContain('accounts.salla.sa/oauth2/auth');
      expect(result.data.url).toContain('client_id=client123');
      expect(result.data.url).toContain('offline_access');
    }
  });

  it('exchange_token stores token on success', async () => {
    server.use(
      http.post('https://accounts.salla.sa/oauth2/token', () =>
        HttpResponse.json({ access_token: 'new-access', refresh_token: 'new-refresh', expires: Math.floor(Date.now() / 1000) + 1209600 })
      )
    );
    const { tokens, oauth } = makeOAuth();
    const result = await oauth.exchangeToken('auth-code-123', 'https://myapp.com/callback');
    expect(result.ok).toBe(true);
    expect(tokens.getAccessToken()).toBe('new-access');
  });

  it('get_current_merchant calls user info endpoint', async () => {
    server.use(
      http.get('https://accounts.salla.sa/oauth2/user/info', () =>
        HttpResponse.json({ id: 42, name: 'Test Merchant' })
      )
    );
    const { oauth } = makeOAuth(true);
    const result = await oauth.getCurrentMerchant();
    expect(result.ok).toBe(true);
    if (result.ok) expect((result.data as { id: number }).id).toBe(42);
  });

  it('get_current_merchant returns auth_required with no token', async () => {
    const { oauth } = makeOAuth(false);
    const result = await oauth.getCurrentMerchant();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('auth_required');
  });
});
