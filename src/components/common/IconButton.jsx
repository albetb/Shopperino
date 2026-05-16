import Icon from './Icon';

export default function IconButton({
  icon,
  size,
  ghost,
  badge,
  disabled,
  onClick,
  title,
  'aria-label': ariaLabel,
  type = 'button',
  className = '',
  style,
  children,
  ...rest
}) {
  const cls = [
    'sh-icon-btn',
    ghost && 'sh-icon-btn--ghost',
    size === 'sm' && 'sh-icon-btn--sm',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button
      type={type}
      className={cls}
      title={title}
      aria-label={ariaLabel ?? title ?? icon}
      onClick={onClick}
      disabled={disabled}
      style={style}
      {...rest}
    >
      {children ?? (icon && <Icon name={icon} />)}
      {badge && <span className="dot" />}
    </button>
  );
}
