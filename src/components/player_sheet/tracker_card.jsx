import { useDispatch, useSelector } from 'react-redux';
import Card from '../common/Card';
import IconButton from '../common/IconButton';
import TrackerRow from './tracker_row';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import '../../style/tracker_card.css';

/**
 * Shared per-day tracker for class features.
 *
 * The counting itself lives in [TrackerRow](./tracker_row.jsx), which a card
 * holding several abilities uses too — so one ability per card and four of
 * them in one card are displayed and spent identically.
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
          <TrackerRow
            name={title}
            used={used}
            max={max}
            unit={unit}
            onUse={onUse}
            onReset={onReset}
            note={note}
            spendControl={spendControl}
          />

          {children}
        </div>
      )}
    </Card>
  );
}
