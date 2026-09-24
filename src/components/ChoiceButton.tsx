export type ChoiceState = 'idle' | 'correct' | 'wrong' | 'dimmed';

interface Props {
  label: string;
  shortcut: number;
  state: ChoiceState;
  disabled: boolean;
  onSelect: () => void;
}

export function ChoiceButton({ label, shortcut, state, disabled, onSelect }: Props) {
  return (
    <button type="button" className={`choice choice-${state}`} disabled={disabled} onClick={onSelect}>
      <kbd aria-hidden="true">{shortcut}</kbd>
      <span>{label}</span>
      {state === 'correct' && <span className="choice-mark" aria-label="correct answer">✓</span>}
      {state === 'wrong' && <span className="choice-mark" aria-label="your answer, incorrect">✗</span>}
    </button>
  );
}
