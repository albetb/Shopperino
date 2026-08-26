import { Children } from 'react';

export default function Card({
  title,
  eyebrow,
  action,
  accent,
  padding = true,
  children,
  className = '',
  style,
  onHeadClick,
}) {
  const cls = ['sh-card', accent && 'sh-card--accent', className].filter(Boolean).join(' ');
  const bodyCls = padding ? 'sh-card-body' : 'sh-card-body sh-card-body--flush';
  const headHasContent = title || eyebrow || action;
  /* A collapsed card passes `false` for its body. toArray drops booleans and
     nulls, so an empty body is skipped entirely rather than left as a padded
     strip under the title — collapsed, the head is the whole card and its
     title sits centred in it. */
  const hasBody = Children.toArray(children).length > 0;
  const headStyle = onHeadClick ? { cursor: 'pointer' } : undefined;
  // When onHeadClick is set, clicks anywhere on the head toggle the card —
  // except when the click originates from inside the `action` slot (so the
  // dedicated chevron / extra buttons keep their own behaviour and don't
  // double-fire). Detect via the closest data-card-head-action wrapper.
  const handleHeadClick = (e) => {
    if (!onHeadClick) return;
    if (e.target.closest?.('[data-card-head-action]')) return;
    onHeadClick(e);
  };
  return (
    <div className={cls} style={style}>
      {headHasContent && (
        <div className="sh-card-head" style={headStyle} onClick={handleHeadClick}>
          {eyebrow && <span className="sh-eyebrow">{eyebrow}</span>}
          {title && <span>{title}</span>}
          {action && <span data-card-head-action>{action}</span>}
        </div>
      )}
      {hasBody && <div className={bodyCls}>{children}</div>}
    </div>
  );
}
