import type { QuizSettings } from '../types';
import { isBetter, loadBest, saveIfBest, scoreKey, type BestScore } from './scores';

const settings: QuizSettings = { mode: 'capital', continents: ['Europe', 'Asia'], questionCount: 10, timerSeconds: 15 };
const score = (correct: number, timeMs: number): BestScore => ({ correct, total: 10, timeMs, date: '2026-09-24' });

beforeEach(() => localStorage.clear());

describe('scoreKey', () => {
  it('is independent of continent order', () => {
    expect(scoreKey(settings)).toBe(scoreKey({ ...settings, continents: ['Asia', 'Europe'] }));
  });

  it('differs by mode, count and timer', () => {
    const key = scoreKey(settings);
    expect(scoreKey({ ...settings, mode: 'country' })).not.toBe(key);
    expect(scoreKey({ ...settings, questionCount: 20 })).not.toBe(key);
    expect(scoreKey({ ...settings, timerSeconds: 0 })).not.toBe(key);
  });
});

describe('isBetter', () => {
  it('ranks by correct answers, then by speed', () => {
    expect(isBetter(score(5, 1000), null)).toBe(true);
    expect(isBetter(score(6, 9000), score(5, 1000))).toBe(true);
    expect(isBetter(score(5, 900), score(5, 1000))).toBe(true);
    expect(isBetter(score(5, 1000), score(5, 1000))).toBe(false);
    expect(isBetter(score(4, 100), score(5, 1000))).toBe(false);
  });
});

describe('saveIfBest / loadBest', () => {
  it('stores only improvements', () => {
    expect(loadBest(settings)).toBeNull();
    expect(saveIfBest(settings, score(5, 5000))).toBe(true);
    expect(saveIfBest(settings, score(4, 1000))).toBe(false);
    expect(loadBest(settings)?.correct).toBe(5);
    expect(saveIfBest(settings, score(7, 8000))).toBe(true);
    expect(loadBest(settings)?.correct).toBe(7);
  });

  it('ignores corrupt entries', () => {
    localStorage.setItem(scoreKey(settings), '{not json');
    expect(loadBest(settings)).toBeNull();
  });

  it('survives storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(loadBest(settings, broken)).toBeNull();
    expect(saveIfBest(settings, score(5, 1000), broken)).toBe(true);
  });
});
