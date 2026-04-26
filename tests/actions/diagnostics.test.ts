import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { TokenManager } from '../../src/token-manager.js';
import { SallaApiClient } from '../../src/api-client.js';
import { DiagnosticsActions } from '../../src/actions/diagnostics.js';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeDiag(withToken = true) {
  const tokens = new TokenManager();
  if (withToken) tokens.setToken({ accessToken: 'tok', refreshToken: 'r', expiresAt: Date.now() + 60_000 });
  return new DiagnosticsActions(new SallaApiClient(tokens), tokens);
}

describe('DiagnosticsActions', () => {
  it('returns healthy report when all checks pass', async () => {
    server.use(
      http.get('https://api.salla.dev/admin/v2/apps/42', () => HttpResponse.json({ data: { id: 42 } })),
      http.get('https://api.salla.dev/admin/v2/apps/42/webhooks', () => HttpResponse.json({ data: [{ id: 'wh1' }] })),
      http.get('https://api.salla.dev/admin/v2/apps/42/subscriptions', () => HttpResponse.json({ data: [{ plan_type: 'recurring' }] }))
    );
    const result = await makeDiag().diagnoseApp(42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.healthy).toBe(true);
      expect(result.data.issues).toHaveLength(0);
    }
  });

  it('reports issues when token is missing', async () => {
    server.use(
      http.get('https://api.salla.dev/admin/v2/apps/42', () => HttpResponse.json({}, { status: 401 })),
      http.get('https://api.salla.dev/admin/v2/apps/42/webhooks', () => HttpResponse.json({}, { status: 401 })),
      http.get('https://api.salla.dev/admin/v2/apps/42/subscriptions', () => HttpResponse.json({}, { status: 401 }))
    );
    const result = await makeDiag(false).diagnoseApp(42);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.issues.length).toBeGreaterThan(0);
  });
});
