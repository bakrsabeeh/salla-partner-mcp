import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { SallaApiClient } from '../src/api-client.js';
import { TokenManager } from '../src/token-manager.js';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeClient() {
  const tokens = new TokenManager();
  tokens.setToken({ accessToken: 'test-token', refreshToken: null, expiresAt: Date.now() + 60_000 });
  return new SallaApiClient(tokens);
}

describe('SallaApiClient', () => {
  it('returns ok result on 200', async () => {
    server.use(
      http.get('https://api.salla.dev/admin/v2/apps', () =>
        HttpResponse.json({ data: [{ id: 1 }] })
      )
    );
    const result = await makeClient().get('/apps');
    expect(result.ok).toBe(true);
    if (result.ok) expect((result.data as { data: unknown[] }).data).toHaveLength(1);
  });

  it('returns missing_scope error on 403', async () => {
    server.use(
      http.get('https://api.salla.dev/admin/v2/apps', () =>
        HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
      )
    );
    const result = await makeClient().get('/apps');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('missing_scope');
  });

  it('returns not_found error on 404', async () => {
    server.use(
      http.get('https://api.salla.dev/admin/v2/apps/999', () =>
        HttpResponse.json({ message: 'Not found' }, { status: 404 })
      )
    );
    const result = await makeClient().get('/apps/999');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('not_found');
  });

  it('returns rate_limited error on 429 with retry-after', async () => {
    server.use(
      http.get('https://api.salla.dev/admin/v2/apps', () =>
        HttpResponse.json({ message: 'Too many requests' }, { status: 429, headers: { 'retry-after': '30' } })
      )
    );
    const result = await makeClient().get('/apps');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('rate_limited');
      expect(result.hint).toContain('30');
    }
  });

  it('returns auth_required when no token set', async () => {
    const tokens = new TokenManager();
    const client = new SallaApiClient(tokens);
    const result = await client.get('/apps');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('auth_required');
  });
});
