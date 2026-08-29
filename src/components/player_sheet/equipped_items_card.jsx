import { useDispatch, useSelector } from 'react-redux';
import Card from '../common/Card';
import Pill from '../common/Pill';
import IconButton from '../common/IconButton';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import { addCardByLink } from '../../store/slices/appSlice';
import { formatItemName } from '../../lib/item/formatItemName';
import { getEffectById } from '../../lib/item/effectsUtils';
import Icon from '../common/Icon';
import { formatWornEffectSummary, ENERGY_TYPES } from '../../lib/item/wornEffects';
import { onSetWornItemChoice } from '../../store/thunks/playerSheetThunks';
import '../../style/worn_effects.css';

/**
 * What the character wears beyond weapon and armor: the four free equipment
 * slots — a cloak, a ring, a wondrous item.
 *
 * Not potions, which are carried rather than worn and have their own card
 * below this one; and not wands, rods or staffs, which are held in a hand and
 * appear on the attacks card.
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

  /* What each slot is actually doing, keyed by slot so a row can find its own.
     Before this the card was a list of names: a cloak of resistance +3 looked
     exactly like a cloak, and the +3 was nowhere. */
  const effectBySlot = Object.fromEntries(
    (player?.getWornEffects?.() ?? []).map((effect) => [effect.slot, effect])
  );
  const stackingWarnings = player?.getWornStackingWarnings?.() ?? [];

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
      onHeadClick={() => dispatch(setCombatPageCardCollapsed({ key: 'items', value: !collapsed }))}
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
            const effect = effectBySlot[item.slot] || null;
            const summary = effect ? formatWornEffectSummary(effect) : '';
            return (
              <div
                key={item.slot}
                className="worn-item-row"
                style={idx === 0
                  ? undefined
                  : { borderTop: '1px solid var(--border-soft)', paddingTop: 'var(--space-2)' }}
              >
                <div className="sh-row-h sh-spread" style={{ gap: 'var(--space-3)' }}>
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

                {/* What it does, in one line. The arithmetic itself lives in
                    each stat's own breakdown box; this only answers whether
                    the item is doing anything at all. */}
                {summary && (
                  <div className={`sh-faint worn-item-effect${effect.inert ? ' worn-item-effect--inert' : ''}`}>
                    {summary}
                  </div>
                )}
                {effect?.situational && (
                  <div className="sh-faint worn-item-note">{effect.situational}</div>
                )}
                {/* Two states worth interrupting for: an item doing nothing
                    for this character, and one still missing its choice. */}
                {effect?.inert && (
                  <div className="sh-warn-strip worn-item-warn">
                    <Icon name="warning" size={14} />
                    {effect.arcaneOnly
                      ? 'Only an arcane caster gains this.'
                      : `A ${effect.raceExcept} gains none of this.`}
                  </div>
                )}
                {/* Normally answered when the item is added; this is the way
                    back for a ring that is already worn. Shown once chosen too,
                    because a ring can be re-attuned and a choice you cannot
                    see is a choice you cannot correct. */}
                {effect?.needsChoice === 'energy' && (
                  <div className="worn-item-choice">
                    <span className="sh-eyebrow">
                      {effect.choice ? 'Resists' : 'Pick the energy it resists'}
                    </span>
                    <div className="worn-item-choice-chips">
                      {ENERGY_TYPES.map((energy) => (
                        <button
                          type="button"
                          key={energy}
                          className={['sh-chip', effect.choice === energy && 'is-on'].filter(Boolean).join(' ')}
                          onClick={() => dispatch(onSetWornItemChoice(
                            item.slot, 'energy', effect.choice === energy ? '' : energy
                          ))}
                        >
                          {energy}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Computed, never enforced: two items of the same bonus type are
              both added and the overlap is reported, exactly as it is for
              two potions. Two rings of protection in two slots is the case
              that makes this real. */}
          {stackingWarnings.map((w) => (
            <div className="sh-warn-strip worn-item-warn" key={`${w.stat}:${w.type}`}>
              <Icon name="warning" size={14} />
              {w.labels.join(' and ')} both give a {w.type} bonus — in 3.5 only the
              larger applies, but both are counted here.
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
