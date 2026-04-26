import { describe, it, expect } from 'vitest';
import type { ToolResult } from '../src/types.js';
import { ok, err } from '../src/types.js';

describe('ToolResult type', () => {
  it('ok result carries data', () => {
    const result: ToolResult<string> = ok('hello');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe('hello');
  });

  it('error result carries error code and message', () => {
    const result: ToolResult<string> = err('auth_required', 'No token present', 'Call get_oauth_url()');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('auth_required');
      expect(result.hint).toBeDefined();
    }
  });
});
