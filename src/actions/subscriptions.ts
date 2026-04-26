import type { SallaApiClient } from '../api-client.js';
import { err, type ToolResult } from '../types.js';

export class SubscriptionActions {
  constructor(private client: SallaApiClient) {}

  async getSubscriptionDetails(appId: number): Promise<ToolResult<unknown>> {
    if (!Number.isFinite(appId)) return err('invalid_app_id', 'app_id must be a valid integer.');
    return this.client.get(`/apps/${appId}/subscriptions`);
  }

  async listAppEvents(appId: number, eventType?: string): Promise<ToolResult<unknown>> {
    if (!Number.isFinite(appId)) return err('invalid_app_id', 'app_id must be a valid integer.');
    const path = eventType
      ? `/apps/${appId}/events?event_type=${encodeURIComponent(eventType)}`
      : `/apps/${appId}/events`;
    return this.client.get(path);
  }
}
