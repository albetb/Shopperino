/**
 * A switch with three positions: left option, neither, right option.
 *
 * Where a plain `Switch` answers yes/no, this answers *which of two* — and
 * keeps "neither yet" as a real, reachable position rather than an accident of
 * both toggles being off. It exists for the monk's bonus feats, where each
 * level offers exactly two mutually exclusive feats and leaving the choice open
 * is legitimate: the rules do not force a monk to decide on this sheet.
 *
 * The whole control is one radiogroup of three buttons, so a keyboard or screen
 * reader meets it as the single choice it is, not as two switches whose
 * exclusivity has to be inferred.
 *
 * @param {string} leftValue  value selected by the left position.
 * @param {string} rightValue value selected by the right position.
 * @param {string} value      currently selected value; anything that matches
 *   neither side reads as the centre.
 * @param {(value: string) => void} onChange receives the new value, or `''` for
 *   the centre.
 */
export default function TriSwitch({
  leftValue,
  rightValue,
  value,
  onChange,
  leftLabel,
  rightLabel,
  centerLabel = 'Neither',
  disabled,
  className = '',
}) {
  const position = value === leftValue ? 'left' : value === rightValue ? 'right' : 'center';
  const options = [
    { key: 'left', label: leftLabel ?? leftValue, next: leftValue },
    { key: 'center', label: centerLabel, next: '' },
    { key: 'right', label: rightLabel ?? rightValue, next: rightValue },
  ];

  return (
    <div
      className={['sh-tri-switch', `is-${position}`, className].filter(Boolean).join(' ')}
      role="radiogroup"
    >
      {/* The travelling knob. Purely decorative — the buttons under it carry
          the state, so it is hidden from assistive technology. */}
      <span className="sh-tri-switch-knob" aria-hidden="true" />
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          role="radio"
          className={`sh-tri-switch-slot sh-tri-switch-slot--${option.key}`}
          aria-checked={position === option.key}
          aria-label={option.label}
          title={option.label}
          disabled={disabled}
          onClick={() => !disabled && onChange?.(option.next)}
        />
      ))}
    </div>
  );
}
