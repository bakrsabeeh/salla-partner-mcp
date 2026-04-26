export type ErrorCode =
  | 'auth_required'
  | 'token_expired'
  | 'missing_scope'
  | 'not_found'
  | 'rate_limited'
  | 'invalid_app_id'
  | 'webhook_unreachable'
  | 'refresh_token_misuse'
  | 'api_error';

export type ToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorCode; message: string; hint?: string };

export function ok<T>(data: T): ToolResult<T> {
  return { ok: true, data };
}

export function err(
  error: ErrorCode,
  message: string,
  hint?: string
): ToolResult<never> {
  return { ok: false, error, message, hint };
}

export interface TokenState {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

export interface SallaAppEvent {
  event: string;
  merchant: number;
  created_at: string;
  data: Record<string, unknown>;
}
