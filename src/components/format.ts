import type { QuizSettings } from '../types';

export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds.toString().padStart(2, '0')}s` : `${seconds}s`;
}

const MODE_LABELS = { capital: 'Country → Capital', country: 'Capital → Country' } as const;

/** Human-readable summary of a settings combination, e.g. "Country → Capital · All continents · 10 questions · 15s". */
export function describeSettings(settings: QuizSettings): string {
  const continents = settings.continents.length ? settings.continents.join(', ') : 'All continents';
  const timer = settings.timerSeconds ? `${settings.timerSeconds}s per question` : 'No timer';
  return [MODE_LABELS[settings.mode], continents, `${settings.questionCount} questions`, timer].join(' · ');
}
