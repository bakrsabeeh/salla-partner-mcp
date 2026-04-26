import axios from 'axios';
import type { TokenManager } from '../token-manager.js';
import { ok, err, type ToolResult } from '../types.js';

const OAUTH_BASE = 'https://accounts.salla.sa/oauth2';

export class OAuthActions {
  constructor(
    private tokens: TokenManager,
    private clientId: string,
    private clientSecret: string
  ) {}

  getOAuthUrl(scopes: string[]): ToolResult<{ url: string; instructions: string }> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: scopes.join(' '),
      state: Math.random().toString(36).slice(2),
    });
    return ok({
      url: `${OAUTH_BASE}/auth?${params}`,
      instructions: 'Direct the merchant to this URL. After they authorize, they will be redirected to your redirect_uri with ?code=AUTH_CODE. Pass that code to exchange_token().',
    });
  }

  async exchangeToken(code: string, redirectUri: string): Promise<ToolResult<unknown>> {
    try {
      const response = await axios.post(`${OAUTH_BASE}/token`, {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        code,
      });
      const { access_token, refresh_token, expires } = response.data;
      this.tokens.setToken({ accessToken: access_token, refreshToken: refresh_token ?? null, expiresAt: expires * 1000 });
      return ok(response.data);
    } catch (e) {
      return err('api_error', `Token exchange failed: ${String(e)}`);
    }
  }

  async refreshAccessToken(): Promise<ToolResult<unknown>> {
    const refreshToken = this.tokens.getRefreshToken();
    if (!refreshToken) {
      return err('token_expired', 'No refresh token stored.', 'The merchant must re-authorize via get_oauth_url()');
    }
    let refreshResult: ToolResult<unknown> = ok({ refreshed: true });
    await this.tokens.withRefreshLock(async () => {
      if (!this.tokens.isExpired()) return;
      try {
        const response = await axios.post(`${OAUTH_BASE}/token`, {
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
        });
        const { access_token, refresh_token: newRefresh, expires } = response.data;
        this.tokens.setToken({ accessToken: access_token, refreshToken: newRefresh ?? null, expiresAt: expires * 1000 });
      } catch (e) {
        const msg = String(e);
        if (msg.includes('401')) {
          refreshResult = err('refresh_token_misuse', 'Refresh token rejected — possible concurrent use.', 'The merchant must reinstall the app to generate new tokens');
        } else {
          refreshResult = err('api_error', `Refresh failed: ${msg}`);
        }
      }
    });
    return refreshResult;
  }

  async getCurrentMerchant(): Promise<ToolResult<unknown>> {
    const token = this.tokens.getAccessToken();
    if (!token) return err('auth_required', 'No access token.', 'Call get_oauth_url() to authorize');
    try {
      const response = await axios.get(`${OAUTH_BASE}/user/info`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return ok(response.data);
    } catch (e) {
      return err('api_error', `Failed to get merchant info: ${String(e)}`);
    }
  }
}
