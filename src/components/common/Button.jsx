import Icon from './Icon';

export default function Button({
  children,
  variant = 'default',
  size,
  block,
  icon,
  iconRight,
  disabled,
  onClick,
  type = 'button',
  className = '',
  style,
  ...rest
}) {
  const cls = [
    'sh-btn',
    variant === 'primary' && 'sh-btn--primary',
    variant === 'ghost' && 'sh-btn--ghost',
    variant === 'danger' && 'sh-btn--danger',
    size === 'sm' && 'sh-btn--sm',
    block && 'sh-btn--block',
    className,
  ].filter(Boolean).join(' ');
  const iconSize = size === 'sm' ? 16 : 18;
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} style={style} {...rest}>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}
