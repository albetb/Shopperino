import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from './Icon';
import BottomSheet from './BottomSheet';
import { isMobile } from '../../lib/utils';
import { sumContributions } from '../../lib/player/contributions';
import '../../style/stat_info.css';

/**
 * The `info` affordance beside a derived stat, and the box it opens.
 *
 * Renders **nothing at all** when there is nothing to say — no contributions
 * and no situational notes. That rule lives here rather than at every call
 * site, so "only show it when something affects this number" is implemented
 * once and cannot drift between the combat page, the ability card and the
 * skills list.
 *
 * Desktop gets an anchored popover; a narrow screen gets a bottom sheet,
 * because a hover tooltip is unreadable on a phone and this app is used on
 * one. The popover's z-index has to clear the bottom sheet's own panel at
 * 1101 — a stat inside an open sheet still needs its box on top, which is
 * exactly the trap the feat picker fell into.
 *
 * @param {string} label - The stat's name, used as the box's title.
 * @param {number|string} value - The number shown on the sheet, so the box can
 *   check its own arithmetic against it.
 * @param {Array} contributions - `{ source, label, type, value }` rows that
 *   must sum to `value`.
 * @param {Array} [situational] - `{ source, label, note }` entries that are
 *   tied to the stat but do not change it.
 * @param {string} [primaryLabel] - An eyebrow above the main list. Only worth
 *   giving when a `secondary` group shares the box and the two need telling
 *   apart — a weapon's attack bonus from its damage bonus.
 * @param {{label: string, value?: number, contributions: Array}} [secondary] -
 *   A second list of contributions with its own heading and its own total.
 *   Omit `value` when the sheet shows no plain number to check the sum
 *   against, as with damage: the pill reads "1d8+3", not "3".
 */
export default function StatInfo({
  label, value, contributions = [], situational = [], className = '',
  primaryLabel = '', secondary = null,
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

  // Position the popover after it has a size, so it can be nudged back inside
  // the viewport rather than opening half off the edge of a narrow window.
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

  const rows = Array.isArray(contributions) ? contributions : [];
  const notes = Array.isArray(situational) ? situational : [];
  const extraRows = Array.isArray(secondary?.contributions) ? secondary.contributions : [];
  // Nothing beyond the plain value, so no affordance at all.
  if (rows.length === 0 && notes.length === 0 && extraRows.length === 0) return null;

  const total = sumContributions(rows);
  const numericValue = Number(value);
  // A mismatch means a source was added to the getter and not to its list. Say
  // so rather than showing a total that quietly disagrees with the sheet.
  const mismatch = rows.length > 0 && Number.isFinite(numericValue) && total !== numericValue;
  const extraTotal = sumContributions(extraRows);
  const extraNumeric = Number(secondary?.value);
  const extraMismatch = extraRows.length > 0
    && Number.isFinite(extraNumeric) && extraTotal !== extraNumeric;

  /* One group of rows plus its total. Written once so the second group cannot
     drift from the first — they are the same thing about a different number. */
  const rowList = (list, sum, keyPrefix) => (
    <ul className="stat-info-rows">
      {list.map((row, i) => (
        <li key={`${keyPrefix}-${row.source}-${i}`} className="stat-info-row">
          <span className="stat-info-row-label">
            {row.label}
            {row.type ? <span className="stat-info-row-type">{row.type}</span> : null}
          </span>
          <span className="stat-info-row-value sh-num">
            {row.value >= 0 ? `+${row.value}` : row.value}
          </span>
        </li>
      ))}
      {/* Labelled as one phrase so a screen reader reads "Total 19" rather
          than two disconnected cells, and so a test can ask for the total
          without reaching into the DOM for its row. */}
      <li className="stat-info-row stat-info-row--total" aria-label={`Total ${sum}`}>
        <span className="stat-info-row-label" aria-hidden="true">Total</span>
        <span className="stat-info-row-value sh-num" aria-hidden="true">{sum}</span>
      </li>
    </ul>
  );

  const body = (
    <div className="stat-info-body">
      {rows.length > 0 && (
        <div className="stat-info-group">
          {primaryLabel && <span className="sh-eyebrow">{primaryLabel}</span>}
          {rowList(rows, total, 'primary')}
        </div>
      )}

      {mismatch && (
        <p className="stat-info-mismatch" role="status">
          <Icon name="warning" size={14} />
          These add up to {total}, but the sheet shows {value}.
        </p>
      )}

      {extraRows.length > 0 && (
        <div className="stat-info-group">
          <span className="sh-eyebrow">{secondary.label}</span>
          {rowList(extraRows, extraTotal, 'secondary')}
          {extraMismatch && (
            <p className="stat-info-mismatch" role="status">
              <Icon name="warning" size={14} />
              These add up to {extraTotal}, but the sheet shows {secondary.value}.
            </p>
          )}
        </div>
      )}

      {notes.length > 0 && (
        <div className="stat-info-situational">
          <span className="sh-eyebrow">Situational</span>
          <ul className="stat-info-notes">
            {notes.map((note, i) => (
              <li key={`${note.source}-${i}`}>
                <span className="stat-info-note-label">{note.label}</span>
                <span className="stat-info-note-text">{note.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className={['stat-info-button', className].filter(Boolean).join(' ')}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label={`What makes up ${label}`}
        aria-expanded={open}
        title={`What makes up ${label}`}
      >
        <Icon name="info" size={14} />
      </button>

      {open && mobile && (
        <BottomSheet open onClose={() => setOpen(false)} title={label} eyebrow={`${value}`}>
          {body}
        </BottomSheet>
      )}

      {open && !mobile && (
        <div
          ref={popoverRef}
          className="popup stat-info-popover"
          /* Above .sh-sheet (1101): a stat inside an open bottom sheet still
             needs its box in front of the sheet, not behind it. */
          style={{ position: 'fixed', top: coords?.top ?? -9999, left: coords?.left ?? -9999, zIndex: 1120 }}
          role="dialog"
          aria-label={label}
        >
          <div className="stat-info-head">
            <span className="stat-info-title">{label}</span>
            <span className="stat-info-value sh-num">{value}</span>
          </div>
          {body}
        </div>
      )}
    </>
  );
}
