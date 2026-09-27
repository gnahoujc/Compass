import { safeStorage } from './storage';

const KEY = 'compass:player';
export const MAX_NAME_LENGTH = 20;

const collapse = (input: string) => input.trim().replace(/\s+/g, ' ');

/** Why a name can't be used (a message for the player), or null if it's fine. Mirrors the database checks. */
export function nameError(input: string): string | null {
  const name = collapse(input);
  if (name.length === 0) return 'Enter a name.';
  if (name.length > MAX_NAME_LENGTH) return `Use at most ${MAX_NAME_LENGTH} characters.`;
  // \p{Cc} matches control characters, which the database also rejects.
  if (/\p{Cc}/u.test(name)) return 'Remove the special (control) characters.';
  return null;
}

/** Trims and collapses whitespace; returns null if the result isn't a usable name. */
export function normalizeName(input: string): string | null {
  return nameError(input) ? null : collapse(input);
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
