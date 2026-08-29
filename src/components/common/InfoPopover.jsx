import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from './Icon';
import BottomSheet from './BottomSheet';
import { isMobile } from '../../lib/utils';
import '../../style/stat_info.css';

/**
 * An `info` button that opens a box of prose.
 *
 * The sibling of `StatInfo`: same affordance, same placement rules, same
 * desktop-popover / mobile-sheet split — but for an explanation rather than a
 * list of numbers that has to add up. It exists because several cards carried
 * a paragraph of rules text inline, which is reference a player reads once and
 * then scrolls past on every visit afterwards.
 *
 * @param {string} label - Names the box, and the button's accessible name.
 * @param {React.ReactNode} children - The explanation.
 */
export default function InfoPopover({ label, children, className = '' }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);
  const [mobile, setMobile] = useState(() => isMobile());

  useEffect(() => {
    const onResize = () => setMobile(isMobile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Positioned after it has a size, so a box opened near an edge is nudged
  // back inside the viewport instead of opening half off it.
  useLayoutEffect(() => {
    if (!open || mobile || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const width = popoverRef.current?.offsetWidth ?? 260;
    const height = popoverRef.current?.offsetHeight ?? 200;
    const margin = 8;
    let left = rect.left;
    let top = rect.bottom + 6;
    if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;
    if (left < margin) left = margin;
    if (top + height > window.innerHeight - margin) top = Math.max(margin, rect.top - height - 6);
    setCoords({ top, left });
  }, [open, mobile]);

  useEffect(() => {
    if (!open || mobile) return undefined;
    const onOutside = (event) => {
      if (popoverRef.current?.contains(event.target)) return;
      if (buttonRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, mobile]);

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className={['stat-info-button', className].filter(Boolean).join(' ')}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label={`How ${label} works`}
        aria-expanded={open}
        title={`How ${label} works`}
      >
        <Icon name="info" size={14} />
      </button>

      {open && mobile && (
        <BottomSheet open onClose={() => setOpen(false)} title={label}>
          <div className="stat-info-body info-popover-prose">{children}</div>
        </BottomSheet>
      )}

      {open && !mobile && (
        <div
          ref={popoverRef}
          className="popup stat-info-popover info-popover"
          /* Above .sh-sheet (1101), so a button inside an open sheet still
             opens its box in front of the sheet rather than behind it. */
          style={{ position: 'fixed', top: coords?.top ?? -9999, left: coords?.left ?? -9999, zIndex: 1120 }}
          role="dialog"
          aria-label={label}
        >
          <div className="stat-info-head">
            <span className="stat-info-title">{label}</span>
          </div>
          <div className="stat-info-body info-popover-prose">{children}</div>
        </div>
      )}
    </>
  );
}
