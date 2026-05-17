export default function Bar({ value, variant, className = '', style }) {
  const raw = Number(value) || 0;
  const overCap = raw > 1;
  const clamped = Math.max(0, Math.min(1, raw));
  const effectiveVariant = overCap && variant !== 'warn' ? 'warn' : variant;
  const cls = [
    'sh-bar',
    effectiveVariant === 'hp' && 'sh-bar--hp',
    effectiveVariant === 'xp' && 'sh-bar--xp',
    effectiveVariant === 'warn' && 'sh-bar--warn',
    effectiveVariant === 'accent' && 'sh-bar--accent',
    effectiveVariant === 'danger' && 'sh-bar--danger',
    className,
  ].filter(Boolean).join(' ');
  return (
    <div className={cls} style={style}>
      <span style={{ width: `${clamped * 100}%` }} />
    </div>
  );
}
