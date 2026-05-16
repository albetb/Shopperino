import Icon from './Icon';

export default function Pill({ children, tone = 'default', icon, className = '', style }) {
  const cls = [
    'sh-pill',
    tone === 'accent' && 'sh-pill--accent',
    tone === 'warn' && 'sh-pill--warn',
    tone === 'danger' && 'sh-pill--danger',
    tone === 'success' && 'sh-pill--success',
    tone === 'ghost' && 'sh-pill--ghost',
    className,
  ].filter(Boolean).join(' ');
  return (
    <span className={cls} style={style}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}
