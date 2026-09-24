import { loadPlayerName, normalizeName, savePlayerName } from './player';

describe('normalizeName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeName('  Ada   Lovelace ')).toBe('Ada Lovelace');
  });

  it('accepts accented and non-Latin names', () => {
    expect(normalizeName('Zoë')).toBe('Zoë');
    expect(normalizeName('李雷')).toBe('李雷');
  });

  it('rejects empty, too long, or control-character names', () => {
    expect(normalizeName('   ')).toBeNull();
    expect(normalizeName('x'.repeat(21))).toBeNull();
    expect(normalizeName('x'.repeat(20))).toBe('x'.repeat(20));
    expect(normalizeName('bad\u0007name')).toBeNull();
  });
});

describe('player name storage', () => {
  beforeEach(() => localStorage.clear());

  it('remembers and clears the name', () => {
    expect(loadPlayerName()).toBe('');
    savePlayerName('Ada');
    expect(loadPlayerName()).toBe('Ada');
    savePlayerName('');
    expect(loadPlayerName()).toBe('');
  });
});
