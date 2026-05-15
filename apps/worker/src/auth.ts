export async function sha256Hex(input: string, pepper = ''): Promise<string> {
  const enc = new TextEncoder().encode(`${pepper}${input}`);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function verifyToken(raw: string | null, expectedHash: string | undefined, pepper?: string): Promise<boolean> {
  if (!raw || !expectedHash) return false;
  const actual = await sha256Hex(raw, pepper || '');
  return constantTimeEqual(actual, expectedHash);
}
