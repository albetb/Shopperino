export default function Card({
  title,
  eyebrow,
  action,
  accent,
  padding = true,
  children,
  className = '',
  style,
}) {
  const cls = ['sh-card', accent && 'sh-card--accent', className].filter(Boolean).join(' ');
  const bodyCls = padding ? 'sh-card-body' : 'sh-card-body sh-card-body--flush';
  return (
    <div className={cls} style={style}>
      {(title || eyebrow || action) && (
        <div className="sh-card-head">
          {eyebrow && <span className="sh-eyebrow">{eyebrow}</span>}
          {title && <span>{title}</span>}
          {action}
        </div>
      )}
      <div className={bodyCls}>{children}</div>
    </div>
  );
}
