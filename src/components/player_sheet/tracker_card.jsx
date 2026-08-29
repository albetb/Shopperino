import { useDispatch, useSelector } from 'react-redux';
import Card from '../common/Card';
import Slots from '../common/Slots';
import IconButton from '../common/IconButton';
import Icon from '../common/Icon';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import '../../style/tracker_card.css';

/* Beyond this many, a pip row stops being readable and the count carries it. */
const MAX_PIPS = 12;

/**
 * Shared per-day tracker for class features.
 *
 * Counts down, not up: the number that matters at the table is what is left,
 * so the readout is `remaining / max` and the pips are filled for uses still
 * in hand. `−` spends one, the rounded arrow restores the counter to full.
 *
 * `onUse` receives a signed delta so a single handler covers spending and
 * giving back. Per the non-enforcing rule in CLAUDE.md the component never
 * blocks going past the maximum — it flags it instead.
 *
 * @param {string} collapseKey key in `combatPageCardsCollapsed`; omit for a
 *   card that should never collapse.
 * @param {number} used current uses or points spent
 * @param {number} max derived maximum; the model owns this calculation
 * @param {(delta: number) => void} onUse
 * @param {() => void} [onReset]
 * @param {React.ReactNode} [spendControl] replaces the default `−` button for
 *   a card that spends in its own way (lay on hands, wholeness of body).
 */
export default function TrackerCard({
  title,
  eyebrow,
  collapseKey,
  used = 0,
  max = 0,
  unit = '',
  onUse,
  onReset,
  note,
  action,
  spendControl,
  children,
}) {
  const dispatch = useDispatch();
  const collapsed = useSelector(
    (state) => (collapseKey ? state.playerSheet?.combatPageCardsCollapsed?.[collapseKey] ?? false : false)
  );

  const usedNum = Math.max(0, Math.floor(Number(used) || 0));
  const maxNum = Math.max(0, Math.floor(Number(max) || 0));
  const remaining = maxNum - usedNum;
  const overCap = usedNum > maxNum;
  const unitLabel = unit ? ` ${unit}` : '';

  const toggleCollapsed = () =>
    dispatch(setCombatPageCardCollapsed({ key: collapseKey, value: !collapsed }));

  return (
    <Card
      title={title}
      eyebrow={eyebrow}
      className="sh-card--head-spread"
      /* The whole head is the target, not just the chevron — Card excludes the
         action slot, so the use/reset buttons still do their own job. */
      onHeadClick={collapseKey ? toggleCollapsed : undefined}
      action={
        <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>
          {action}
          {collapseKey && (
            <IconButton
              icon={collapsed ? 'expand_more' : 'expand_less'}
              ghost
              size="sm"
              title={collapsed ? 'Expand' : 'Collapse'}
              aria-label={`Toggle ${title}`}
              onClick={toggleCollapsed}
            />
          )}
        </span>
      }
    >
      {!collapsed && (
        <div className="sh-stack tracker-card">
          <div className="tracker-card-row">
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
              {spendControl ?? (
                <IconButton
                  icon="remove"
                  ghost
                  size="sm"
                  title="Use one"
                  aria-label={`Use one ${title}`}
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
                  aria-label={`Restore ${title}`}
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

          {children}
        </div>
      )}
    </Card>
  );
}
