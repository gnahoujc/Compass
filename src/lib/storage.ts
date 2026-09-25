/** localStorage, or undefined when the browser blocks it (private mode, disabled site data). */
export function safeStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
