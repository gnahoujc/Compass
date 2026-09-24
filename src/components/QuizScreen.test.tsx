import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Question, QuizSettings } from '../types';
import { QuizScreen } from './QuizScreen';

const questions: Question[] = [
  {
    country: { name: 'France', code: 'fr', capital: 'Paris', continent: 'Europe' },
    prompt: 'What is the capital of France?',
    answer: 'Paris',
    choices: ['Madrid', 'Paris', 'Rome', 'Berlin'],
  },
  {
    country: { name: 'Japan', code: 'jp', capital: 'Tokyo', continent: 'Asia' },
    prompt: 'What is the capital of Japan?',
    answer: 'Tokyo',
    choices: ['Seoul', 'Beijing', 'Tokyo', 'Hanoi'],
  },
];

const settings = (timerSeconds: number): QuizSettings => ({
  mode: 'capital',
  continents: [],
  questionCount: 2,
  timerSeconds,
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('QuizScreen', () => {
  it('records answers, shows feedback and finishes', () => {
    const onFinish = vi.fn();
    render(<QuizScreen questions={questions} settings={settings(0)} onFinish={onFinish} onQuit={() => {}} feedbackMs={500} />);

    expect(screen.getByRole('heading', { name: 'What is the capital of France?' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Flag of France' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Paris/ }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Flag of France' })).toHaveAttribute('src', expect.stringContaining('fr.svg'));
    expect(screen.getByText('Score 1')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole('heading', { name: 'What is the capital of Japan?' })).toBeInTheDocument();

    // Keyboard shortcut: "1" selects Seoul (wrong).
    fireEvent.keyDown(window, { key: '1' });
    expect(screen.getByText(/Not quite/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'See results' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
    const [records] = onFinish.mock.calls[0];
    expect(records.map((r: { selected: string; correct: boolean }) => [r.selected, r.correct])).toEqual([
      ['Paris', true],
      ['Seoul', false],
    ]);
  });

  it('marks the question wrong when the timer expires', () => {
    render(<QuizScreen questions={questions} settings={settings(10)} onFinish={() => {}} onQuit={() => {}} />);
    expect(screen.getByRole('timer')).toHaveTextContent('10s');

    act(() => vi.advanceTimersByTime(10_100));
    expect(screen.getByText(/Time's up!/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Flag of France' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Paris/ })).toHaveClass('choice-correct');
  });
});
