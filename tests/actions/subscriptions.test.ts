import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { TokenManager } from '../../src/token-manager.js';
import { SallaApiClient } from '../../src/api-client.js';
import { SubscriptionActions } from '../../src/actions/subscriptions.js';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeSubs() {
  const tokens = new TokenManager();
  tokens.setToken({ accessToken: 'tok', refreshToken: null, expiresAt: Date.now() + 60_000 });
  return new SubscriptionActions(new SallaApiClient(tokens));
}

describe('SubscriptionActions', () => {
  it('get_subscription_details returns data', async () => {
    server.use(http.get('https://api.salla.dev/admin/v2/apps/42/subscriptions', () =>
      HttpResponse.json({ data: [{ id: 'sub1', plan_type: 'recurring' }] })
    ));
    expect((await makeSubs().getSubscriptionDetails(42)).ok).toBe(true);
  });

  it('list_app_events returns events', async () => {
    server.use(http.get('https://api.salla.dev/admin/v2/apps/42/events', () => HttpResponse.json({ data: [] })));
    expect((await makeSubs().listAppEvents(42)).ok).toBe(true);
  });

  it('list_app_events passes event_type as query param', async () => {
    let calledUrl = '';
    server.use(http.get('https://api.salla.dev/admin/v2/apps/42/events', ({ request }) => {
      calledUrl = request.url;
      return HttpResponse.json({ data: [] });
    }));
    await makeSubs().listAppEvents(42, 'app.installed');
    expect(calledUrl).toContain('event_type=app.installed');
  });
});
