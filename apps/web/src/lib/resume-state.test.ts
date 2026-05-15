import { describe, expect, it } from 'vitest';
import { clearActiveOperation, loadActiveOperation, saveActiveOperation, shouldResumeOperation } from './resume-state';

class MemoryStorage implements Pick<Storage, 'getItem'|'setItem'|'removeItem'> {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

describe('resume state', () => {
  it('persists enough active operation data to resume after refresh', () => {
    const storage = new MemoryStorage();
    saveActiveOperation(storage, { kind: 'spot-draft', id: 'draft_123', spotId: 'spot_1', startedAt: 1000 });
    expect(loadActiveOperation(storage)).toEqual({ kind: 'spot-draft', id: 'draft_123', spotId: 'spot_1', startedAt: 1000 });
  });

  it('ignores malformed active operation data instead of crashing the app', () => {
    const storage = new MemoryStorage();
    storage.setItem('agl_active_operation', '{bad json');
    expect(loadActiveOperation(storage)).toBeNull();
  });

  it('expires very old active operations', () => {
    expect(shouldResumeOperation({ kind: 'graphic-draft', id: 'draft_1', startedAt: 0 }, 25 * 60 * 60 * 1000)).toBe(false);
  });

  it('clears completed active operations', () => {
    const storage = new MemoryStorage();
    saveActiveOperation(storage, { kind: 'article-analysis', id: 'analysis_1', startedAt: 1000 });
    clearActiveOperation(storage);
    expect(loadActiveOperation(storage)).toBeNull();
  });
});
