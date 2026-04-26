import { describe, it, expect, beforeEach } from 'vitest';
import { TokenManager } from '../src/token-manager.js';

describe('TokenManager', () => {
  let manager: TokenManager;

  beforeEach(() => {
    manager = new TokenManager();
  });

  it('starts with no token', () => {
    expect(manager.hasToken()).toBe(false);
    expect(manager.isExpired()).toBe(true);
  });

  it('stores token state', () => {
    manager.setToken({ accessToken: 'abc', refreshToken: 'r123', expiresAt: Date.now() + 60_000 });
    expect(manager.hasToken()).toBe(true);
    expect(manager.isExpired()).toBe(false);
    expect(manager.getAccessToken()).toBe('abc');
  });

  it('reports expired when past expiresAt', () => {
    manager.setToken({ accessToken: 'abc', refreshToken: null, expiresAt: Date.now() - 1000 });
    expect(manager.isExpired()).toBe(true);
  });

  it('clears token state', () => {
    manager.setToken({ accessToken: 'abc', refreshToken: 'r', expiresAt: Date.now() + 60_000 });
    manager.clear();
    expect(manager.hasToken()).toBe(false);
  });

  it('serializes concurrent refresh calls', async () => {
    let callCount = 0;
    const fakeRefresh = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 10));
    };
    manager.setToken({ accessToken: 'old', refreshToken: 'r', expiresAt: Date.now() - 1000 });
    await Promise.all([
      manager.withRefreshLock(fakeRefresh),
      manager.withRefreshLock(fakeRefresh),
      manager.withRefreshLock(fakeRefresh),
    ]);
    expect(callCount).toBe(3);
  });
});
