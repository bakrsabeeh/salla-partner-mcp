import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TokenManager } from './token-manager.js';
import { SallaApiClient } from './api-client.js';
import { OAuthActions } from './actions/oauth.js';
import { AppActions } from './actions/apps.js';
import { WebhookActions } from './actions/webhooks.js';
import { SubscriptionActions } from './actions/subscriptions.js';
import { DiagnosticsActions } from './actions/diagnostics.js';
import {
  askQuestion, getGuide, listWebhookEvents, getEventSchema,
  getCodeExample, getOAuthGuide, getPublishingChecklist, getSubscriptionPlanTypes,
} from './knowledge/tools.js';

export function createServer(): McpServer {
  const tokens = new TokenManager();

  if (process.env.SALLA_ACCESS_TOKEN) {
    tokens.setToken({
      accessToken: process.env.SALLA_ACCESS_TOKEN,
      refreshToken: process.env.SALLA_REFRESH_TOKEN ?? null,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    });
  }

  const client = new SallaApiClient(tokens);
  const oauth = new OAuthActions(tokens, process.env.SALLA_CLIENT_ID ?? '', process.env.SALLA_CLIENT_SECRET ?? '');
  const apps = new AppActions(client);
  const webhooks = new WebhookActions(client);
  const subscriptions = new SubscriptionActions(client);
  const diagnostics = new DiagnosticsActions(client, tokens);

  const server = new McpServer({ name: 'salla-partner-mcp', version: '0.1.0' });

  const text = (v: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(v, null, 2) }] });

  // ── Knowledge Layer ──────────────────────────────────────────────────────────

  server.tool('ask_question', 'Ask anything about the Salla Partner API — get a doc-sourced answer and code example',
    { query: z.string().describe('Your question about the Salla Partner API') },
    async ({ query }) => text(askQuestion(query))
  );

  server.tool('get_guide', 'Get a step-by-step guide for a Salla Partner API topic',
    { topic: z.string().describe('Topic: create_app | setup_oauth | configure_webhooks | submit_app | manage_subscriptions | trusted_ips | snippets | custom_plans | dns | testing | publishing | app_requirements') },
    async ({ topic }) => text(getGuide(topic))
  );

  server.tool('list_webhook_events', 'List all available Salla webhook event types, optionally filtered by category',
    { filter: z.enum(['app', 'order', 'product', 'customer', 'shipping', 'store', 'misc']).optional().describe('Event category to filter by') },
    async ({ filter }) => text(listWebhookEvents(filter))
  );

  server.tool('get_event_schema', 'Get full payload schema for a specific Salla webhook event',
    { event_name: z.string().describe('Event name, e.g. app.store.authorize, order.created, app.installed') },
    async ({ event_name }) => text(getEventSchema(event_name))
  );

  server.tool('get_code_example', 'Get a ready-to-use TypeScript code snippet for a Salla feature',
    { feature: z.string().describe('Feature: oauth_easy_mode | oauth_custom_mode | verify_webhook | refresh_token | api_request') },
    async ({ feature }) => text(getCodeExample(feature))
  );

  server.tool('get_oauth_guide', 'Get the OAuth 2.0 guide for Easy Mode or Custom Mode',
    { mode: z.enum(['easy', 'custom']).optional().describe('OAuth mode — omit for both') },
    async ({ mode }) => text(getOAuthGuide(mode))
  );

  server.tool('get_publishing_checklist', 'Get the 6-step app publishing requirements checklist',
    { app_id: z.number().optional().describe('App ID — if provided, annotates checklist with known app data') },
    async () => text(getPublishingChecklist())
  );

  server.tool('get_subscription_plan_types', 'Get definitions for all 6 Salla subscription plan types (Free, Monthly, Yearly, One-Time, Pay-As-You-Go, Addon)',
    {},
    async () => text(getSubscriptionPlanTypes())
  );

  // ── Action Layer — OAuth ─────────────────────────────────────────────────────

  server.tool('get_oauth_url', 'Generate the OAuth authorization URL to send a merchant to',
    { scopes: z.array(z.string()).describe('OAuth scopes, e.g. ["offline_access", "orders.read"]') },
    async ({ scopes }) => text(oauth.getOAuthUrl(scopes))
  );

  server.tool('exchange_token', 'Exchange an authorization code for access and refresh tokens',
    {
      code: z.string().describe('Authorization code received in the OAuth redirect'),
      redirect_uri: z.string().describe('The redirect URI registered in your app'),
    },
    async ({ code, redirect_uri }) => text(await oauth.exchangeToken(code, redirect_uri))
  );

  server.tool('refresh_access_token', 'Refresh the access token using the stored refresh token',
    {},
    async () => text(await oauth.refreshAccessToken())
  );

  server.tool('get_current_merchant', 'Get info about the currently authenticated merchant',
    {},
    async () => text(await oauth.getCurrentMerchant())
  );

  // ── Action Layer — Apps ──────────────────────────────────────────────────────

  server.tool('list_apps', 'List all apps in the partner account',
    {},
    async () => text(await apps.listApps())
  );

  server.tool('get_app', 'Get full details of a specific app (keys, scopes, status, category)',
    { app_id: z.number().describe('Salla app ID from Partners Portal → My Apps') },
    async ({ app_id }) => text(await apps.getApp(app_id))
  );

  server.tool('get_app_settings', 'Get custom settings configured for an app by merchants',
    { app_id: z.number().describe('Salla app ID') },
    async ({ app_id }) => text(await apps.getAppSettings(app_id))
  );

  server.tool('regenerate_secret', 'Regenerate the client secret or webhook secret for an app',
    {
      app_id: z.number().describe('Salla app ID'),
      type: z.enum(['client_secret', 'webhook_secret']).describe('Which secret to regenerate'),
    },
    async ({ app_id, type }) => text(await apps.regenerateSecret(app_id, type))
  );

  // ── Action Layer — Webhooks ──────────────────────────────────────────────────

  server.tool('list_webhooks', 'List all registered webhooks for an app',
    { app_id: z.number().describe('Salla app ID') },
    async ({ app_id }) => text(await webhooks.listWebhooks(app_id))
  );

  server.tool('register_webhook', 'Register a new webhook endpoint for a specific event',
    {
      app_id: z.number().describe('Salla app ID'),
      event: z.string().describe('Event name, e.g. order.created, app.installed'),
      url: z.string().url().describe('Your webhook endpoint URL'),
      strategy: z.enum(['signature', 'token', 'none']).optional().describe('Security strategy (default: signature)'),
    },
    async ({ app_id, event, url, strategy }) => text(await webhooks.registerWebhook(app_id, event, url, strategy))
  );

  server.tool('delete_webhook', 'Remove a webhook registration',
    {
      app_id: z.number().describe('Salla app ID'),
      webhook_id: z.string().describe('Webhook ID to delete'),
    },
    async ({ app_id, webhook_id }) => text(await webhooks.deleteWebhook(app_id, webhook_id))
  );

  server.tool('get_webhook_logs', 'Get delivery logs for webhooks to debug failed deliveries',
    {
      app_id: z.number().describe('Salla app ID'),
      webhook_id: z.string().optional().describe('Specific webhook ID — omit for all webhooks'),
    },
    async ({ app_id, webhook_id }) => text(await webhooks.getWebhookLogs(app_id, webhook_id))
  );

  // ── Action Layer — Subscriptions ─────────────────────────────────────────────

  server.tool('get_subscription_details', 'Get full subscription data for an app: plan, pricing, features, balance, coupon',
    { app_id: z.number().describe('Salla app ID') },
    async ({ app_id }) => text(await subscriptions.getSubscriptionDetails(app_id))
  );

  server.tool('list_app_events', 'List recent app lifecycle events (installs, uninstalls, feedback, settings updates)',
    {
      app_id: z.number().describe('Salla app ID'),
      event_type: z.string().optional().describe('Filter by event type, e.g. app.installed'),
    },
    async ({ app_id, event_type }) => text(await subscriptions.listAppEvents(app_id, event_type))
  );

  // ── Action Layer — Diagnostics ────────────────────────────────────────────────

  server.tool('diagnose_app', 'Run a health check: token state, app config, webhook health, subscription status — returns issues with fix suggestions',
    { app_id: z.number().describe('Salla app ID to diagnose') },
    async ({ app_id }) => text(await diagnostics.diagnoseApp(app_id))
  );

  return server;
}
