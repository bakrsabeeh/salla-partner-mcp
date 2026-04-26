import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { TokenManager } from '../../src/token-manager.js';
import { SallaApiClient } from '../../src/api-client.js';
import { WebhookActions } from '../../src/actions/webhooks.js';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeWebhooks() {
  const tokens = new TokenManager();
  tokens.setToken({ accessToken: 'tok', refreshToken: null, expiresAt: Date.now() + 60_000 });
  return new WebhookActions(new SallaApiClient(tokens));
}

describe('WebhookActions', () => {
  it('list_webhooks returns webhooks', async () => {
    server.use(http.get('https://api.salla.dev/admin/v2/apps/42/webhooks', () => HttpResponse.json({ data: [{ id: 'wh1' }] })));
    expect((await makeWebhooks().listWebhooks(42)).ok).toBe(true);
  });

  it('register_webhook posts with correct body', async () => {
    let body: unknown;
    server.use(http.post('https://api.salla.dev/admin/v2/apps/42/webhooks', async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ data: { id: 'new-wh' } });
    }));
    await makeWebhooks().registerWebhook(42, 'order.created', 'https://myapp.com/wh', 'signature');
    expect((body as { event: string }).event).toBe('order.created');
    expect((body as { security_strategy: string }).security_strategy).toBe('signature');
  });

  it('delete_webhook calls DELETE', async () => {
    let deletedPath = '';
    server.use(http.delete('https://api.salla.dev/admin/v2/apps/42/webhooks/wh1', ({ request }) => {
      deletedPath = new URL(request.url).pathname;
      return HttpResponse.json({ data: { deleted: true } });
    }));
    await makeWebhooks().deleteWebhook(42, 'wh1');
    expect(deletedPath).toContain('wh1');
  });

  it('get_webhook_logs returns logs', async () => {
    server.use(http.get('https://api.salla.dev/admin/v2/apps/42/webhooks/logs', () => HttpResponse.json({ data: [] })));
    expect((await makeWebhooks().getWebhookLogs(42)).ok).toBe(true);
  });
});
