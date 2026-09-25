import type { QuizSettings } from '../types';
import { safeStorage } from './storage';

export interface BestScore {
  correct: number;
  total: number;
  timeMs: number;
  /** ISO date string. */
  date: string;
}

const PREFIX = 'compass:best';

/**
 * Scores are only comparable between quizzes with identical settings. This key
 * identifies those settings, e.g. "capital:all:10:15"; the online scoreboard
 * uses it too.
 */
export function categoryKey(settings: QuizSettings): string {
  const continents = settings.continents.length ? [...settings.continents].sort().join(',') : 'all';
  return `${settings.mode}:${continents}:${settings.questionCount}:${settings.timerSeconds}`;
}

export function scoreKey(settings: QuizSettings): string {
  return `${PREFIX}:${categoryKey(settings)}`;
}

export function isBetter(candidate: BestScore, current: BestScore | null): boolean {
  if (!current) return true;
  if (candidate.correct !== current.correct) return candidate.correct > current.correct;
  return candidate.timeMs < current.timeMs;
}

export function loadBest(settings: QuizSettings, storage: Storage | undefined = safeStorage()): BestScore | null {
  try {
    const raw = storage?.getItem(scoreKey(settings));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BestScore;
    return typeof parsed.correct === 'number' && typeof parsed.timeMs === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

/** Saves `score` if it beats the stored best. Returns true when it is a new best. */
export function saveIfBest(
  settings: QuizSettings,
  score: BestScore,
  storage: Storage | undefined = safeStorage(),
): boolean {
  if (!isBetter(score, loadBest(settings, storage))) return false;
  try {
    storage?.setItem(scoreKey(settings), JSON.stringify(score));
  } catch {
    // Storage full or blocked — still report the new best for this session.
  }
  return true;
}
