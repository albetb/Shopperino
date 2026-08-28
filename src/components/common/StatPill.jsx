import Icon from './Icon';

/**
 * `cond` marks the value as altered by a temporary effect. Pass the signed
 * delta to glow by direction — green when the effect raised the stat, red when
 * it lowered it. Passing a plain `true` keeps the older neutral tint, for a
 * change whose sign carries no meaning.
 *
 * `info` takes a rendered `<StatInfo>` and places it opposite the edit pencil.
 * It is optional on purpose: the animal companion, familiar, special mount and
 * monster sheets all use this component with no breakdown behind their numbers,
 * and must render exactly as they did without it.
 */
export default function StatPill({ label, value, sub, accent, editing, onEdit, cond, info, className = '' }) {
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
      {info && <span className="sh-stat-pill-info">{info}</span>}
      <div className="lbl">{label}</div>
      <div className="val sh-num">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
