import { Mutex } from 'async-mutex';
import type { TokenState } from './types.js';

export class TokenManager {
  private state: TokenState | null = null;
  private mutex = new Mutex();

  setToken(state: TokenState): void {
    this.state = state;
  }

  clear(): void {
    this.state = null;
  }

  hasToken(): boolean {
    return this.state !== null;
  }

  isExpired(): boolean {
    if (!this.state) return true;
    return Date.now() >= this.state.expiresAt;
  }

  getAccessToken(): string | null {
    return this.state?.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    return this.state?.refreshToken ?? null;
  }

  // Serializes refresh calls — prevents Salla's parallel-refresh security lockout
  // (concurrent refresh revokes all tokens and forces merchant reinstall).
  async withRefreshLock(fn: () => Promise<void>): Promise<void> {
    await this.mutex.runExclusive(fn);
  }
}
