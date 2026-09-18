import { safeStoredState } from './core.mjs';

export function loadDraft(storage, key, fallback) {
  try {
    return safeStoredState(storage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

export function saveDraft(storage, key, state) {
  try {
    storage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // The successful submission must not be blocked by unavailable storage.
  }
}
