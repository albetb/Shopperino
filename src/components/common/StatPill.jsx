export default function StatPill({ label, value, sub, accent, className = '' }) {
  const cls = ['sh-stat-pill', accent && 'sh-stat-pill--accent', className].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <div className="lbl">{label}</div>
      <div className="val sh-num">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}
