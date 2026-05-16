import { useEffect } from 'react';
import IconButton from './IconButton';

/**
 * Mobile sidebar drawer. Slides in from the left over a scrim.
 * Tap-scrim and Escape both call onClose.
 */
export default function Drawer({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="sh-drawer-scrim" onClick={onClose} role="presentation" />
      <aside className="sh-drawer" role="dialog" aria-modal="true" aria-label={title}>
        {title && (
          <div className="sh-drawer-head">
            <span className="ttl">{title}</span>
            <IconButton icon="close" ghost size="sm" onClick={onClose} aria-label="Close menu" />
          </div>
        )}
        <div className="sh-drawer-body">{children}</div>
      </aside>
    </>
  );
}
