import { useEffect } from 'react';

export default function Modal({ open, onClose, title, eyebrow, footer, children, dismissOnScrim = true }) {
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
    <div
      className="sh-modal-scrim"
      onClick={dismissOnScrim ? onClose : undefined}
      role="presentation"
    >
      <div
        className="sh-modal"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        onClick={e => e.stopPropagation()}
      >
        {(title || eyebrow) && (
          <div className="sh-modal-head">
            {eyebrow && <span className="sh-eyebrow">{eyebrow}</span>}
            {title}
          </div>
        )}
        <div className="sh-modal-body">{children}</div>
        {footer && <div className="sh-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
