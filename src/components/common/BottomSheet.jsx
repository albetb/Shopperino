import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import IconButton from './IconButton';

/**
 * A sheet that slides up from the bottom of the **viewport**.
 *
 * Rendered into `document.body` through a portal rather than where it is
 * written. A `position: fixed` overlay left deep in the tree is at the mercy
 * of whatever sizes its parent's children: the potions card returns a fragment,
 * so its sheet became a direct child of `.combat-page-wrap`, which sets
 * `width: 92%` on its children for the card column — and the sheet stopped
 * being as wide as the screen. An ancestor with a `transform` or `filter` would
 * break it the same way, by becoming the containing block for `fixed`.
 *
 * The portal costs nothing else: React still bubbles events through the React
 * tree, the theme lives on `<body>` so it still applies, and every `.sh-sheet`
 * CSS rule targets the sheet or its descendants rather than its ancestors.
 *
 * @param {boolean} [fixedHeight] pin the sheet to its maximum height instead of
 *   letting it shrink to its content. Use it where the body is filtered live:
 *   a shrinking sheet walks its own controls under a phone keyboard.
 */
export default function BottomSheet({ open, onClose, title, eyebrow, subheader, fixedHeight, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="sh-scrim" onClick={onClose} role="presentation" />
      <div
        className={['sh-sheet', fixedHeight && 'sh-sheet--fixed'].filter(Boolean).join(' ')}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title || eyebrow}
      >
        <div className="handle" aria-hidden="true" />
        {(title || eyebrow) && (
          <div className="sh-sheet-head">
            <span className="sh-sheet-head-spacer" aria-hidden="true" />
            <div className="sh-sheet-head-text">
              {eyebrow && <span className="sh-eyebrow" style={{ display: 'block' }}>{eyebrow}</span>}
              {title && <span className="ttl">{title}</span>}
            </div>
            <IconButton icon="close" ghost size="sm" onClick={onClose} aria-label="Close" />
          </div>
        )}
        {subheader && <div className="sh-sheet-sub">{subheader}</div>}
        <div className="sh-sheet-scroll">{children}</div>
      </div>
    </>,
    document.body
  );
}
