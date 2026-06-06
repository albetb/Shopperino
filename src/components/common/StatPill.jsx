import Icon from './Icon';

export default function StatPill({ label, value, sub, accent, editing, onEdit, cond, className = '' }) {
  const cls = [
    'sh-stat-pill',
    accent && 'sh-stat-pill--accent',
    editing && 'sh-stat-pill--editing',
    onEdit && 'sh-stat-pill--has-edit',
    cond && 'sh-stat-pill--cond',
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
