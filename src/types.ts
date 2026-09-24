export const CONTINENTS = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
] as const;

export type Continent = (typeof CONTINENTS)[number];

export interface Country {
  name: string;
  /** ISO 3166-1 alpha-2 code, lowercase; used to look up the flag. */
  code: string;
  capital: string;
  continent: Continent;
}

/** `capital`: given a country, name its capital. `country`: given a capital, name its country. */
export type QuizMode = 'capital' | 'country';

export interface QuizSettings {
  mode: QuizMode;
  continents: Continent[];
  questionCount: number;
  /** Seconds per question; 0 disables the timer. */
  timerSeconds: number;
}

export interface Question {
  country: Country;
  prompt: string;
  answer: string;
  choices: string[];
}

export interface AnswerRecord {
  question: Question;
  /** `null` when the timer ran out. */
  selected: string | null;
  correct: boolean;
}
