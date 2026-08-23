import Icon from './Icon';

/**
 * `cond` marks the value as altered by a temporary effect. Pass the signed
 * delta to glow by direction — green when the effect raised the stat, red when
 * it lowered it. Passing a plain `true` keeps the older neutral tint, for a
 * change whose sign carries no meaning.
 */
export default function StatPill({ label, value, sub, accent, editing, onEdit, cond, className = '' }) {
  const delta = typeof cond === 'number' ? cond : 0;
  const cls = [
    'sh-stat-pill',
    accent && 'sh-stat-pill--accent',
    editing && 'sh-stat-pill--editing',
    onEdit && 'sh-stat-pill--has-edit',
    cond && (delta > 0 ? 'sh-stat-pill--up' : delta < 0 ? 'sh-stat-pill--down' : 'sh-stat-pill--cond'),
    className,
  ].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {onEdit && (
        <button
          type="button"
          className="sh-stat-pill-edit"
          aria-label={`Edit ${label} modifier`}
          aria-pressed={editing || undefined}
          onClick={onEdit}
        >
          <Icon name={editing ? 'close' : 'edit'} size={14} />
        </button>
      )}
      <div className="lbl">{label}</div>
      <div className="val sh-num">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
