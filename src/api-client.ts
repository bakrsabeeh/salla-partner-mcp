import axios, { type AxiosInstance } from 'axios';
import type { TokenManager } from './token-manager.js';
import { ok, err, type ToolResult } from './types.js';

const API_BASE = 'https://api.salla.dev/admin/v2';

export class SallaApiClient {
  private http: AxiosInstance;

  constructor(private tokens: TokenManager) {
    this.http = axios.create({ baseURL: API_BASE });
  }

  async get<T = unknown>(path: string): Promise<ToolResult<T>> {
    return this.request<T>('GET', path);
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<ToolResult<T>> {
    return this.request<T>('POST', path, body);
  }

  async delete<T = unknown>(path: string): Promise<ToolResult<T>> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<ToolResult<T>> {
    const token = this.tokens.getAccessToken();
    if (!token) {
      return err('auth_required', 'No access token. Call get_oauth_url() to authorize.');
    }
    try {
      const response = await this.http.request<T>({
        method,
        url: path,
        data: body,
        headers: { Authorization: `Bearer ${token}` },
      });
      return ok(response.data);
    } catch (e: unknown) {
      return this.normalizeError(e);
    }
  }

  private normalizeError(e: unknown): ToolResult<never> {
    if (!axios.isAxiosError(e) || !e.response) {
      return err('api_error', String(e));
    }
    const status = e.response.status;
    if (status === 401) {
      return err('token_expired', 'Access token expired or revoked.', 'Call refresh_access_token() or re-authorize via get_oauth_url()');
    }
    if (status === 403) {
      return err('missing_scope', 'Insufficient scope for this operation.', 'Check your app scopes in the Salla Partners Portal');
    }
    if (status === 404) {
      return err('not_found', 'Resource not found.', 'Verify the app_id or resource identifier');
    }
    if (status === 429) {
      const retryAfter = e.response.headers['retry-after'] ?? 'unknown';
      return err('rate_limited', 'Rate limit exceeded.', `Retry after ${retryAfter} seconds`);
    }
    return err('api_error', `API error ${status}: ${JSON.stringify(e.response.data)}`);
  }
}
