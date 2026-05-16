export default function Switch({ checked, onChange, disabled, 'aria-label': ariaLabel, className = '' }) {
  return (
    <button
      type="button"
      className={`sh-switch ${className}`.trim()}
      aria-checked={checked ? 'true' : 'false'}
      aria-label={ariaLabel}
      role="switch"
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
    />
  );
}
