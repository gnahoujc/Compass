import { safeStorage } from './storage';

const KEY = 'compass:player';
export const MAX_NAME_LENGTH = 20;

/** Trims and collapses whitespace; returns null if the result isn't a usable name. */
export function normalizeName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, ' ');
  // \p{Cc} matches control characters, which the database also rejects.
  if (name.length === 0 || name.length > MAX_NAME_LENGTH || /\p{Cc}/u.test(name)) return null;
  return name;
}

export function loadPlayerName(storage: Storage | undefined = safeStorage()): string {
  try {
    return storage?.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function savePlayerName(name: string, storage: Storage | undefined = safeStorage()): void {
  try {
    if (name) storage?.setItem(KEY, name);
    else storage?.removeItem(KEY);
  } catch {
    // Storage blocked: the name just won't be remembered next visit.
  }
}
