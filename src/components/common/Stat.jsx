export default function Stat({ label, score, mod, tone, className = '' }) {
  const modNum = typeof mod === 'number' ? mod : Number(mod);
  const modStr = Number.isFinite(modNum)
    ? (modNum >= 0 ? `+${modNum}` : `−${Math.abs(modNum)}`) // unicode minus
    : String(mod);
  const cls = [
    'sh-stat',
    tone === 'accent' && 'sh-stat--accent',
    tone === 'warn' && 'sh-stat--warn',
    className,
  ].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <span className="sh-stat-label">{label}</span>
      <span className="sh-stat-mod sh-num">{modStr}</span>
      <span className="sh-stat-score sh-num">{score}</span>
    </div>
  );
}
