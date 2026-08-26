import { useDispatch, useSelector } from 'react-redux';
import Card from '../common/Card';
import Pill from '../common/Pill';
import IconButton from '../common/IconButton';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import { addCardByLink } from '../../store/slices/appSlice';
import { formatItemName } from '../../lib/item/formatItemName';
import { getEffectById } from '../../lib/item/effectsUtils';

/**
 * What the character carries ready to hand: the four free equipment slots,
 * the ones that are neither weapon nor armor — a wondrous item, a wand, a
 * potion kept within reach.
 *
 * It sits under the attacks card because it answers the same question in
 * combat: what can I reach for this round. The slots themselves are edited on
 * the equipment page; this is a read-only list.
 *
 * Absent entirely when nothing is in those slots — an empty card on the combat
 * page is four wasted lines.
 */
export default function EquippedItemsCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const collapsed = useSelector(
    (state) => state.playerSheet?.combatPageCardsCollapsed?.items ?? false
  );

  const items = player?.getEquippedAccessories?.() ?? [];
  if (items.length === 0) return null;

  /* The info sidebar wants the item and its effects together, so a flaming
     wand opens both cards — the same links the equipment page opens. */
  const openCard = (item) => {
    if (!item.link) return;
    const effectLinks = item.effectIds
      .map((id) => getEffectById(id)?.Link)
      .filter(Boolean);
    dispatch(addCardByLink({
      links: effectLinks.length ? [item.link, ...effectLinks] : item.link,
      bonus: item.bonus || 0,
    }));
  };

  return (
    <Card
      title="Equipment"
      className="sh-card--head-spread"
      action={
        <IconButton
          icon={collapsed ? 'expand_more' : 'expand_less'}
          ghost size="sm"
          onClick={() => dispatch(setCombatPageCardCollapsed({ key: 'items', value: !collapsed }))}
          aria-label="Toggle equipment"
        />
      }
    >
      {!collapsed && (
        <div className="sh-stack" style={{ gap: 'var(--space-2)' }}>
          {items.map((item, idx) => {
            const displayName = formatItemName(item.name, {
              masterwork: item.masterwork,
              bonus: item.bonus,
              effectIds: item.effectIds,
            });
            return (
              <div
                key={item.slot}
                className="sh-row-h sh-spread"
                style={idx === 0
                  ? { gap: 'var(--space-3)' }
                  : { gap: 'var(--space-3)', borderTop: '1px solid var(--border-soft)', paddingTop: 'var(--space-2)' }}
              >
                <span className="sh-row-h equipped-item-label">
                  {item.link ? (
                    <button
                      type="button"
                      className="button-link equipped-item-name"
                      onClick={() => openCard(item)}
                      title={displayName}
                    >
                      {displayName}
                    </button>
                  ) : (
                    <span className="equipped-item-name" title={displayName}>{displayName}</span>
                  )}
                </span>
                {/* The count only earns its place when there is more than one —
                    an "x1" on every line is noise. */}
                {item.number > 1 && <Pill tone="ghost">x{item.number}</Pill>}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
