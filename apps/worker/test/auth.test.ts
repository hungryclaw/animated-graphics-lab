import { describe, expect, it } from 'vitest';
import { constantTimeEqual, sha256Hex, verifyToken } from '../src/auth';
import { queuePosition } from '../src/queue';

describe('worker auth and queue helpers', () => {
  it('verifies only matching token hashes', async () => {
    const hash = await sha256Hex('gl_master_secret', 'pepper');
    await expect(verifyToken('gl_master_secret', hash, 'pepper')).resolves.toBe(true);
    await expect(verifyToken('wrong', hash, 'pepper')).resolves.toBe(false);
  });
  it('uses constant-time equality semantics for equal-length strings', () => {
    expect(constantTimeEqual('abc','abc')).toBe(true);
    expect(constantTimeEqual('abc','abd')).toBe(false);
    expect(constantTimeEqual('abc','ab')).toBe(false);
  });
  it('calculates fifo queue positions', () => {
    expect(queuePosition(['a','b','c'], 'b')).toBe(2);
    expect(queuePosition(['a','b','c'], 'x')).toBeUndefined();
  });
});
