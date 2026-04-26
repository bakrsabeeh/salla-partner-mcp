import { describe, it, expect, beforeAll } from 'vitest';
import { TokenManager } from '../../src/token-manager.js';
import { SallaApiClient } from '../../src/api-client.js';
import { OAuthActions } from '../../src/actions/oauth.js';
import { AppActions } from '../../src/actions/apps.js';
import { WebhookActions } from '../../src/actions/webhooks.js';
import { SubscriptionActions } from '../../src/actions/subscriptions.js';
import { DiagnosticsActions } from '../../src/actions/diagnostics.js';

const E2E = process.env.TEST_E2E === 'true';

describe.skipIf(!E2E)('E2E: App Lifecycle with Demo Store', () => {
  const tokens = new TokenManager();
  let appId: number;

  beforeAll(() => {
    if (!process.env.SALLA_ACCESS_TOKEN) throw new Error('SALLA_ACCESS_TOKEN required for E2E');
    if (!process.env.SALLA_APP_ID) throw new Error('SALLA_APP_ID required for E2E');
    tokens.setToken({
      accessToken: process.env.SALLA_ACCESS_TOKEN,
      refreshToken: process.env.SALLA_REFRESH_TOKEN ?? null,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    });
    appId = Number(process.env.SALLA_APP_ID);
  });

  it('get_current_merchant returns merchant data', async () => {
    const oauth = new OAuthActions(tokens, process.env.SALLA_CLIENT_ID!, process.env.SALLA_CLIENT_SECRET!);
    const result = await oauth.getCurrentMerchant();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toHaveProperty('id');
  });

  it('get_subscription_details returns subscription data', async () => {
    const subs = new SubscriptionActions(new SallaApiClient(tokens));
    const result = await subs.getSubscriptionDetails(appId);
    expect(result.ok).toBe(true);
  });

  it('list_webhooks returns registered webhooks', async () => {
    const wh = new WebhookActions(new SallaApiClient(tokens));
    const result = await wh.listWebhooks(appId);
    expect(result.ok).toBe(true);
  });

  it('diagnose_app returns a health report', async () => {
    const client = new SallaApiClient(tokens);
    const diag = new DiagnosticsActions(client, tokens);
    const result = await diag.diagnoseApp(appId);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toHaveProperty('healthy');
  });
});
