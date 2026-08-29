import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import BottomSheet from './BottomSheet';
import { isMobile } from '../../lib/utils';
import '../../style/stat_info.css';

/**
 * A box that opens beside its own button on a desktop and as a sheet on a
 * phone.
 *
 * The placement rules were written once, for `InfoPopover`, and are the same
 * every time: measure after it has a size so a box near an edge is nudged back
 * inside the viewport, close on an outside click or Escape, and become a
 * bottom sheet below the mobile breakpoint because a 260px popover anchored to
 * a table row is unusable on a phone. They live here so the second and third
 * things that need them are not a second and third copy.
 *
 * @param {string} label - Names the box, and its accessible name.
 * @param {(api: {ref: object, open: boolean, toggle: () => void}) => React.ReactNode} renderTrigger
 * @param {string} [width] - CSS width for the desktop popover.
 */
export default function AnchorPopover({
  label,
  renderTrigger,
  className = '',
  width,
  children,
}) {
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

  useLayoutEffect(() => {
    if (!open || mobile || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const boxWidth = popoverRef.current?.offsetWidth ?? 260;
    const height = popoverRef.current?.offsetHeight ?? 200;
    const margin = 8;
    let left = rect.left;
    let top = rect.bottom + 6;
    if (left + boxWidth > window.innerWidth - margin) left = window.innerWidth - boxWidth - margin;
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

  const toggle = () => setOpen((v) => !v);

  return (
    <>
      {renderTrigger({ ref: buttonRef, open, toggle })}

      {open && mobile && (
        <BottomSheet open onClose={() => setOpen(false)} title={label}>
          <div className="stat-info-body">{children}</div>
        </BottomSheet>
      )}

      {open && !mobile && (
        <div
          ref={popoverRef}
          className={['popup', 'stat-info-popover', className].filter(Boolean).join(' ')}
          /* Above .sh-sheet (1101), so a button inside an open sheet still
             opens its box in front of the sheet rather than behind it. */
          style={{
            position: 'fixed',
            top: coords?.top ?? -9999,
            left: coords?.left ?? -9999,
            zIndex: 1120,
            ...(width ? { width } : {}),
          }}
          role="dialog"
          aria-label={label}
        >
          <div className="stat-info-head">
            <span className="stat-info-title">{label}</span>
          </div>
          <div className="stat-info-body">{children}</div>
        </div>
      )}
    </>
  );
}
