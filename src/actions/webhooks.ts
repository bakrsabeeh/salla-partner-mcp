import type { SallaApiClient } from '../api-client.js';
import { err, type ToolResult } from '../types.js';

type SecurityStrategy = 'signature' | 'token' | 'none';

export class WebhookActions {
  constructor(private client: SallaApiClient) {}

  async listWebhooks(appId: number): Promise<ToolResult<unknown>> {
    if (!Number.isFinite(appId)) return err('invalid_app_id', 'app_id must be a valid integer.');
    return this.client.get(`/apps/${appId}/webhooks`);
  }

  async registerWebhook(appId: number, event: string, url: string, strategy: SecurityStrategy = 'signature'): Promise<ToolResult<unknown>> {
    if (!Number.isFinite(appId)) return err('invalid_app_id', 'app_id must be a valid integer.');
    return this.client.post(`/apps/${appId}/webhooks`, { event, url, security_strategy: strategy, version: 2 });
  }

  async deleteWebhook(appId: number, webhookId: string): Promise<ToolResult<unknown>> {
    if (!Number.isFinite(appId)) return err('invalid_app_id', 'app_id must be a valid integer.');
    return this.client.delete(`/apps/${appId}/webhooks/${webhookId}`);
  }

  async getWebhookLogs(appId: number, webhookId?: string): Promise<ToolResult<unknown>> {
    if (!Number.isFinite(appId)) return err('invalid_app_id', 'app_id must be a valid integer.');
    const path = webhookId ? `/apps/${appId}/webhooks/${webhookId}/logs` : `/apps/${appId}/webhooks/logs`;
    return this.client.get(path);
  }
}
