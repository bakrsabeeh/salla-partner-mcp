import type { SallaApiClient } from '../api-client.js';
import { err, type ToolResult } from '../types.js';

export class AppActions {
  constructor(private client: SallaApiClient) {}

  async listApps(): Promise<ToolResult<unknown>> {
    return this.client.get('/apps');
  }

  async getApp(appId: number): Promise<ToolResult<unknown>> {
    if (!Number.isFinite(appId)) {
      return err('invalid_app_id', 'app_id must be a valid integer.', 'Find your app_id in Salla Partners Portal → My Apps');
    }
    return this.client.get(`/apps/${appId}`);
  }

  async getAppSettings(appId: number): Promise<ToolResult<unknown>> {
    if (!Number.isFinite(appId)) return err('invalid_app_id', 'app_id must be a valid integer.');
    return this.client.get(`/apps/${appId}/settings`);
  }

  async regenerateSecret(appId: number, type: 'client_secret' | 'webhook_secret'): Promise<ToolResult<unknown>> {
    if (!Number.isFinite(appId)) return err('invalid_app_id', 'app_id must be a valid integer.');
    const path = type === 'client_secret'
      ? `/apps/${appId}/regenerate-client-secret`
      : `/apps/${appId}/regenerate-webhook-secret`;
    return this.client.post(path);
  }
}
