import Icon from './Icon';

export default function Chip({ children, on, icon, onClick, disabled, className = '' }) {
  const cls = ['sh-chip', on && 'is-on', className].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      className={cls}
      aria-pressed={on ? 'true' : 'false'}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
}
