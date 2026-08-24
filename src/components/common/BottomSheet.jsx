import { useEffect, useRef } from 'react';
import IconButton from './IconButton';

/**
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

  return (
    <>
      <div className="sh-scrim" onClick={onClose} role="presentation" />
      <div
        className={['sh-sheet', fixedHeight && 'sh-sheet--fixed'].filter(Boolean).join(' ')}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
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
    </>
  );
}
