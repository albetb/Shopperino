import Slots from '../common/Slots';
import IconButton from '../common/IconButton';
import Icon from '../common/Icon';

/* Beyond this many, a pip row stops being readable and the count carries it. */
const MAX_PIPS = 12;

/**
 * One per-day counter: `remaining / max`, its pips, and the buttons that spend
 * and restore it.
 *
 * Extracted from `TrackerCard` so a card holding several abilities counts them
 * exactly the way a card holding one does. Everything about how a use is
 * displayed — counting down rather than up, the over-cap strip, the disabled
 * restore button — lives here once and cannot drift between the two.
 *
 * Counts **down**: what matters at the table is what is left, so the pips are
 * filled for uses still in hand. Per the non-enforcing rule in CLAUDE.md going
 * past the maximum is flagged, never blocked.
 *
 * @param {string} name - What the buttons call this, for their aria labels.
 * @param {React.ReactNode} [label] - Shown at the head of the row. Omit inside
 *   a card whose title already names the thing being counted.
 * @param {number} used - Uses or points already spent.
 * @param {number} max - The derived maximum; the model owns that calculation.
 * @param {(delta: number) => void} [onUse] - Signed, so one handler spends and
 *   gives back.
 * @param {React.ReactNode} [spendControl] - Replaces the default `−` for a
 *   counter that spends in its own way (lay on hands, wholeness of body).
 */
export default function TrackerRow({
  name,
  label,
  used = 0,
  max = 0,
  unit = '',
  onUse,
  onReset,
  note,
  action,
  spendControl,
}) {
  const usedNum = Math.max(0, Math.floor(Number(used) || 0));
  const maxNum = Math.max(0, Math.floor(Number(max) || 0));
  const remaining = maxNum - usedNum;
  const overCap = usedNum > maxNum;
  const unitLabel = unit ? ` ${unit}` : '';

  return (
    <>
      <div className="tracker-card-row">
        {label && <span className="tracker-row-label">{label}</span>}

        <span className="tracker-card-count">
          <span className={overCap ? 'tracker-card-count-over' : undefined}>
            {Math.max(0, remaining)}
          </span>
          <span className="tracker-card-sep">/</span>
          {maxNum}{unitLabel}
        </span>

        {maxNum > 0 && maxNum <= MAX_PIPS && (
          /* Slots fills `used` pips; here the filled ones are what is
             left, so the remaining count is passed as the used one. */
          <Slots total={maxNum} used={Math.max(0, remaining)} />
        )}

        <span className="tracker-card-controls">
          {action}
          {spendControl ?? (
            <IconButton
              icon="remove"
              ghost
              size="sm"
              title="Use one"
              aria-label={`Use one ${name}`}
              onClick={() => onUse?.(1)}
            />
          )}
          {onReset && (
            <IconButton
              icon="restart_alt"
              ghost
              size="sm"
              disabled={usedNum === 0}
              title="Restore to maximum"
              aria-label={`Restore ${name}`}
              onClick={onReset}
            />
          )}
        </span>
      </div>

      {overCap && (
        <div className="sh-warn-strip tracker-card-over">
          <Icon name="warning" />
          {usedNum - maxNum}{unitLabel} over the limit for this level
        </div>
      )}

      {note && (
        <div className="tracker-card-row tracker-card-meta">
          <span className="sh-faint tracker-card-note">{note}</span>
        </div>
      )}
    </>
  );
}
