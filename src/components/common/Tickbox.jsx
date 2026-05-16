import Icon from './Icon';

export default function Tickbox({ checked, onChange, disabled, icon = 'check', 'aria-label': ariaLabel, className = '' }) {
  return (
    <button
      type="button"
      className={`sh-tickbox ${className}`.trim()}
      aria-checked={checked ? 'true' : 'false'}
      role="checkbox"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
    >
      {checked && <Icon name={icon} />}
    </button>
  );
}
