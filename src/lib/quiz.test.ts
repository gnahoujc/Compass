import { COUNTRIES } from '../data/countries';
import { CONTINENTS, type QuizSettings } from '../types';
import { buildQuestions, CHOICE_COUNT, filterByContinents, makeChoices, shuffle, type Rng } from './quiz';

/** Deterministic PRNG (mulberry32) so failures are reproducible. */
function seeded(seed: number): Rng {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const base: QuizSettings = { mode: 'capital', continents: [], questionCount: 10, timerSeconds: 0 };

describe('country data', () => {
  it('has 195 countries with unique names and capitals', () => {
    expect(COUNTRIES).toHaveLength(195);
    expect(new Set(COUNTRIES.map((c) => c.name)).size).toBe(COUNTRIES.length);
    expect(new Set(COUNTRIES.map((c) => c.capital)).size).toBe(COUNTRIES.length);
  });

  it('covers every continent', () => {
    for (const continent of CONTINENTS) {
      expect(COUNTRIES.some((c) => c.continent === continent)).toBe(true);
    }
  });
});

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input, seeded(1));
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...result].sort()).toEqual(input);
  });
});

describe('filterByContinents', () => {
  it('returns everything for an empty selection', () => {
    expect(filterByContinents(COUNTRIES, [])).toHaveLength(COUNTRIES.length);
  });

  it('keeps only the selected continents', () => {
    const result = filterByContinents(COUNTRIES, ['Oceania', 'South America']);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((c) => c.continent === 'Oceania' || c.continent === 'South America')).toBe(true);
  });
});

describe('makeChoices', () => {
  const france = COUNTRIES.find((c) => c.name === 'France')!;

  it('returns 4 unique choices including the answer', () => {
    for (let seed = 0; seed < 50; seed++) {
      const choices = makeChoices(france, COUNTRIES, 'capital', seeded(seed));
      expect(choices).toHaveLength(CHOICE_COUNT);
      expect(new Set(choices).size).toBe(CHOICE_COUNT);
      expect(choices).toContain('Paris');
    }
  });

  it('prefers distractors from the same continent', () => {
    const european = new Set(COUNTRIES.filter((c) => c.continent === 'Europe').map((c) => c.capital));
    const choices = makeChoices(france, COUNTRIES, 'capital', seeded(7));
    expect(choices.every((c) => european.has(c))).toBe(true);
  });

  it('falls back to other continents when the pool is small', () => {
    const pool = COUNTRIES.filter((c) => c.continent === 'South America').slice(0, 2).concat(france);
    const choices = makeChoices(pool[0], pool, 'capital', seeded(3));
    expect(choices).toHaveLength(3); // only 3 distinct capitals available
    expect(choices).toContain('Paris');
  });

  it('uses country names in country mode', () => {
    const choices = makeChoices(france, COUNTRIES, 'country', seeded(2));
    expect(choices).toContain('France');
    expect(choices.every((c) => COUNTRIES.some((country) => country.name === c))).toBe(true);
  });
});

describe('buildQuestions', () => {
  it('builds the requested number of distinct questions', () => {
    const questions = buildQuestions(COUNTRIES, base, seeded(1));
    expect(questions).toHaveLength(10);
    expect(new Set(questions.map((q) => q.country.name)).size).toBe(10);
    for (const q of questions) {
      expect(q.answer).toBe(q.country.capital);
      expect(q.prompt).toBe(`What is the capital of ${q.country.name}?`);
      expect(q.choices).toContain(q.answer);
    }
  });

  it('respects the continent filter and caps at available countries', () => {
    const oceania = COUNTRIES.filter((c) => c.continent === 'Oceania').length;
    const questions = buildQuestions(COUNTRIES, { ...base, continents: ['Oceania'], questionCount: 100 }, seeded(4));
    expect(questions).toHaveLength(oceania);
    expect(questions.every((q) => q.country.continent === 'Oceania')).toBe(true);
    expect(questions.every((q) => q.choices.length === CHOICE_COUNT)).toBe(true);
  });

  it('asks for the country in reverse mode', () => {
    const [q] = buildQuestions(COUNTRIES, { ...base, mode: 'country', questionCount: 1 }, seeded(5));
    expect(q.answer).toBe(q.country.name);
    expect(q.prompt).toBe(`${q.country.capital} is the capital of which country?`);
  });
});
