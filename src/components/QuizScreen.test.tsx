import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    render(<QuizScreen questions={questions} settings={settings(0)} onFinish={onFinish} onQuit={() => {}} />);

    expect(screen.getByRole('heading', { name: 'What is the capital of France?' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Flag of France' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Paris/ }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Flag of France' })).toHaveAttribute('src', expect.stringContaining('fr.svg'));
    expect(screen.getByText('Score 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
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

  it('waits on the answer until the player moves on', () => {
    const onFinish = vi.fn();
    render(<QuizScreen questions={questions} settings={settings(10)} onFinish={onFinish} onQuit={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Madrid/ }));

    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByRole('heading', { name: 'What is the capital of France?' })).toBeInTheDocument();
    expect(screen.getByText(/Not quite/)).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('focuses Next after answering, and Enter on it advances exactly once', async () => {
    vi.useRealTimers(); // user-event waits on real timers; nothing here is time-based
    const user = userEvent.setup();
    const onFinish = vi.fn();
    render(<QuizScreen questions={questions} settings={settings(0)} onFinish={onFinish} onQuit={() => {}} />);

    await user.keyboard('2'); // Paris
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: 'What is the capital of Japan?' })).toBeInTheDocument();
    expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('lets Enter activate another focused button instead of advancing', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const onQuit = vi.fn();
    render(<QuizScreen questions={questions} settings={settings(0)} onFinish={() => {}} onQuit={onQuit} />);

    await user.keyboard('2');
    screen.getByRole('button', { name: 'Quit' }).focus();
    await user.keyboard('{Enter}');
    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'What is the capital of France?' })).toBeInTheDocument();
  });

  it('advances with Enter when focus is not on a button', () => {
    render(<QuizScreen questions={questions} settings={settings(0)} onFinish={() => {}} onQuit={() => {}} />);
    fireEvent.keyDown(window, { key: '2' });
    (document.activeElement as HTMLElement).blur();

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByRole('heading', { name: 'What is the capital of Japan?' })).toBeInTheDocument();
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
