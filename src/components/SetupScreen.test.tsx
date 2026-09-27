import { fireEvent, render, screen } from '@testing-library/react';
import { SetupScreen } from './SetupScreen';

const initial = { mode: 'capital' as const, continents: [], questionCount: 10, timerSeconds: 0 };

function renderSetup(playerName: string, onStart = vi.fn()) {
  render(
    <SetupScreen
      initial={initial}
      onStart={onStart}
      playerName={playerName}
      onPlayerNameChange={vi.fn()}
      onShowScoreboard={vi.fn()}
    />,
  );
  return onStart;
}

describe('SetupScreen player name', () => {
  it('accepts a blank or valid name without an error', () => {
    renderSetup('');
    expect(screen.getByLabelText('Player name')).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText(/won't be posted/)).not.toBeInTheDocument();
  });

  it('flags an invalid name but still lets the quiz start', () => {
    const onStart = renderSetup('bad\u0007name');
    const input = screen.getByLabelText('Player name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/control.*won't be posted/);

    fireEvent.submit(input.closest('form')!);
    expect(onStart).toHaveBeenCalled();
  });
});
