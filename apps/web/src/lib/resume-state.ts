const ACTIVE_OPERATION_KEY = 'agl_active_operation';
const SAVED_STATE_KEY = 'agl_saved_state';

export type ActiveOperation =
  | { kind: 'graphic-draft'; id: string; startedAt: number }
  | { kind: 'article-analysis'; id: string; startedAt: number }
  | { kind: 'spot-draft'; id: string; spotId: string; revision?: boolean; startedAt: number };

export function storageGet<T>(storage: Pick<Storage, 'getItem'>, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export function storageSet(storage: Pick<Storage, 'setItem'>, key: string, value: unknown) {
  storage.setItem(key, JSON.stringify(value));
}

export function storageRemove(storage: Pick<Storage, 'removeItem'>, key: string) {
  storage.removeItem(key);
}

export function saveActiveOperation(storage: Pick<Storage, 'setItem'>, op: ActiveOperation) {
  storageSet(storage, ACTIVE_OPERATION_KEY, op);
}

export function loadActiveOperation(storage: Pick<Storage, 'getItem'>): ActiveOperation | null {
  const op = storageGet<ActiveOperation>(storage, ACTIVE_OPERATION_KEY);
  if (!op || !op.id || !op.startedAt) return null;
  if (op.kind === 'spot-draft' && !op.spotId) return null;
  return op;
}

export function clearActiveOperation(storage: Pick<Storage, 'removeItem'>) {
  storageRemove(storage, ACTIVE_OPERATION_KEY);
}

export function saveAppState(storage: Pick<Storage, 'setItem'>, state: unknown) {
  storageSet(storage, SAVED_STATE_KEY, state);
}

export function loadAppState<T>(storage: Pick<Storage, 'getItem'>): T | null {
  return storageGet<T>(storage, SAVED_STATE_KEY);
}

export function shouldResumeOperation(op: ActiveOperation, now = Date.now(), maxAgeMs = 24 * 60 * 60 * 1000) {
  return now - op.startedAt <= maxAgeMs;
}
