import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { TokenManager } from '../../src/token-manager.js';
import { SallaApiClient } from '../../src/api-client.js';
import { AppActions } from '../../src/actions/apps.js';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeApps() {
  const tokens = new TokenManager();
  tokens.setToken({ accessToken: 'tok', refreshToken: null, expiresAt: Date.now() + 60_000 });
  return new AppActions(new SallaApiClient(tokens));
}

describe('AppActions', () => {
  it('list_apps returns apps array', async () => {
    server.use(http.get('https://api.salla.dev/admin/v2/apps', () => HttpResponse.json({ data: [{ id: 1 }] })));
    const result = await makeApps().listApps();
    expect(result.ok).toBe(true);
  });

  it('get_app returns app details', async () => {
    server.use(http.get('https://api.salla.dev/admin/v2/apps/42', () => HttpResponse.json({ data: { id: 42 } })));
    expect((await makeApps().getApp(42)).ok).toBe(true);
  });

  it('get_app returns invalid_app_id for NaN', async () => {
    const result = await makeApps().getApp(NaN);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('invalid_app_id');
  });

  it('get_app_settings returns settings', async () => {
    server.use(http.get('https://api.salla.dev/admin/v2/apps/42/settings', () => HttpResponse.json({ data: { app_id: '42', settings: {} } })));
    expect((await makeApps().getAppSettings(42)).ok).toBe(true);
  });

  it('regenerate_secret calls client_secret endpoint', async () => {
    let calledPath = '';
    server.use(http.post('https://api.salla.dev/admin/v2/apps/42/regenerate-client-secret', ({ request }) => {
      calledPath = new URL(request.url).pathname;
      return HttpResponse.json({ data: { client_secret: 'new' } });
    }));
    await makeApps().regenerateSecret(42, 'client_secret');
    expect(calledPath).toContain('regenerate-client-secret');
  });

  it('regenerate_secret calls webhook_secret endpoint', async () => {
    let calledPath = '';
    server.use(http.post('https://api.salla.dev/admin/v2/apps/42/regenerate-webhook-secret', ({ request }) => {
      calledPath = new URL(request.url).pathname;
      return HttpResponse.json({ data: { webhook_secret: 'new' } });
    }));
    await makeApps().regenerateSecret(42, 'webhook_secret');
    expect(calledPath).toContain('regenerate-webhook-secret');
  });
});
