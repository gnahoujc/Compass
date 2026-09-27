import { render, screen } from '@testing-library/react';
import { Leaderboard } from './Leaderboard';

const rows = [
  { playerName: 'Grace', correct: 10, total: 10, timeMs: 30_000 },
  { playerName: 'Ada', correct: 9, total: 10, timeMs: 20_000 },
  { playerName: 'Linus', correct: 8, total: 10, timeMs: 25_000 },
];

describe('Leaderboard', () => {
  it('highlights the top player for everyone, even without a name', () => {
    render(<Leaderboard rows={rows} error={false} onRetry={vi.fn()} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveClass('leader');
    expect(items[0]).toHaveTextContent('1, top score');
    expect(items[1]).not.toHaveClass('leader');
    expect(items[2]).not.toHaveClass('leader');
    expect(items.filter((li) => li.classList.contains('me'))).toHaveLength(0);
  });

  it('keeps the player highlight separate from the leader highlight', () => {
    render(<Leaderboard rows={rows} error={false} highlightName="grace" onRetry={vi.fn()} />);
    const [first, second] = screen.getAllByRole('listitem');
    expect(first).toHaveClass('leader', 'me');
    expect(second).not.toHaveClass('me');
  });

  it('shares the top spot between exact ties', () => {
    const tied = [rows[0], { ...rows[0], playerName: 'Alan' }, rows[1]];
    render(<Leaderboard rows={tied} error={false} onRetry={vi.fn()} />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.classList.contains('leader'))).toEqual([true, true, false]);
  });
});
