import Icon from './Icon';
import AnchorPopover from './AnchorPopover';
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
 * The placement itself lives in `AnchorPopover`, which is the same box opened
 * by a different button.
 *
 * @param {string} label - Names the box, and the button's accessible name.
 * @param {React.ReactNode} children - The explanation.
 */
export default function InfoPopover({ label, children, className = '' }) {
  return (
    <AnchorPopover
      label={label}
      className="info-popover"
      renderTrigger={({ ref, open, toggle }) => (
        <button
          type="button"
          ref={ref}
          className={['stat-info-button', className].filter(Boolean).join(' ')}
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          aria-label={`How ${label} works`}
          aria-expanded={open}
          title={`How ${label} works`}
        >
          <Icon name="info" size={14} />
        </button>
      )}
    >
      <div className="info-popover-prose">{children}</div>
    </AnchorPopover>
  );
}
