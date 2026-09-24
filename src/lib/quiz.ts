import type { Continent, Country, Question, QuizMode, QuizSettings } from '../types';

export type Rng = () => number;

export const CHOICE_COUNT = 4;

export function filterByContinents(countries: Country[], continents: Continent[]): Country[] {
  if (continents.length === 0) return countries;
  return countries.filter((c) => continents.includes(c.continent));
}

/** Fisher–Yates shuffle; returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function answerFor(country: Country, mode: QuizMode): string {
  return mode === 'capital' ? country.capital : country.name;
}

function promptFor(country: Country, mode: QuizMode): string {
  return mode === 'capital'
    ? `What is the capital of ${country.name}?`
    : `${country.capital} is the capital of which country?`;
}

/**
 * Picks the correct answer plus distractors, preferring countries from the same
 * continent (they make for harder, more interesting choices) and falling back to
 * the whole pool when a continent is too small.
 */
export function makeChoices(
  country: Country,
  pool: Country[],
  mode: QuizMode,
  rng: Rng = Math.random,
): string[] {
  const answer = answerFor(country, mode);
  const seen = new Set([answer]);
  const distractors: string[] = [];

  const sameContinent = pool.filter((c) => c.continent === country.continent);
  const others = pool.filter((c) => c.continent !== country.continent);

  for (const candidate of [...shuffle(sameContinent, rng), ...shuffle(others, rng)]) {
    if (distractors.length === CHOICE_COUNT - 1) break;
    const value = answerFor(candidate, mode);
    if (seen.has(value)) continue;
    seen.add(value);
    distractors.push(value);
  }

  return shuffle([answer, ...distractors], rng);
}

/**
 * Builds a quiz from the countries in the selected continents. Distractors are
 * drawn from the full `countries` list so small selections still get 4 choices.
 */
export function buildQuestions(
  countries: Country[],
  settings: QuizSettings,
  rng: Rng = Math.random,
): Question[] {
  const eligible = filterByContinents(countries, settings.continents);
  return shuffle(eligible, rng)
    .slice(0, settings.questionCount)
    .map((country) => ({
      country,
      prompt: promptFor(country, settings.mode),
      answer: answerFor(country, settings.mode),
      choices: makeChoices(country, countries, settings.mode, rng),
    }));
}
