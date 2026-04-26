import type { SallaApiClient } from '../api-client.js';
import type { TokenManager } from '../token-manager.js';
import { ok, type ToolResult } from '../types.js';

interface DiagnosticReport {
  app_id: number;
  healthy: boolean;
  issues: string[];
  suggestions: string[];
  checks: { token: 'ok' | 'missing' | 'expired'; app: 'ok' | 'error'; webhooks: 'ok' | 'none' | 'error'; subscription: 'ok' | 'none' | 'error' };
}

export class DiagnosticsActions {
  constructor(private client: SallaApiClient, private tokens: TokenManager) {}

  async diagnoseApp(appId: number): Promise<ToolResult<DiagnosticReport>> {
    const report: DiagnosticReport = {
      app_id: appId,
      healthy: true,
      issues: [],
      suggestions: [],
      checks: { token: 'ok', app: 'ok', webhooks: 'ok', subscription: 'ok' },
    };

    if (!this.tokens.hasToken()) {
      report.checks.token = 'missing';
      report.issues.push('No access token configured.');
      report.suggestions.push('Call get_oauth_url() to start the OAuth flow.');
      report.healthy = false;
    } else if (this.tokens.isExpired()) {
      report.checks.token = 'expired';
      report.issues.push('Access token is expired.');
      report.suggestions.push('Call refresh_access_token() to get a new token.');
      report.healthy = false;
    }

    const appResult = await this.client.get(`/apps/${appId}`);
    if (!appResult.ok) {
      report.checks.app = 'error';
      report.issues.push(`Cannot fetch app details: ${appResult.error}`);
      report.suggestions.push('Verify app_id is correct and your token has the required scope.');
      report.healthy = false;
    }

    const whResult = await this.client.get<{ data: unknown[] }>(`/apps/${appId}/webhooks`);
    if (!whResult.ok) {
      report.checks.webhooks = 'error';
      report.issues.push(`Cannot fetch webhooks: ${whResult.error}`);
      report.healthy = false;
    } else if (!whResult.data.data || whResult.data.data.length === 0) {
      report.checks.webhooks = 'none';
      report.suggestions.push('No webhooks registered. Call register_webhook() to subscribe to events.');
    }

    const subResult = await this.client.get<{ data: unknown[] }>(`/apps/${appId}/subscriptions`);
    if (!subResult.ok) {
      report.checks.subscription = 'error';
      report.issues.push(`Cannot fetch subscription: ${subResult.error}`);
      report.healthy = false;
    } else if (!subResult.data.data || subResult.data.data.length === 0) {
      report.checks.subscription = 'none';
      report.suggestions.push('No active subscription found for this app.');
    }

    return ok(report);
  }
}
