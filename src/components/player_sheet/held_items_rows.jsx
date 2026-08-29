import { useDispatch, useSelector } from 'react-redux';
import Pill from '../common/Pill';
import Icon from '../common/Icon';
import IconButton from '../common/IconButton';
import InfoPopover from '../common/InfoPopover';
import SpellLink from '../common/spell_link';
import {
  onSpendHeldItemCharges,
  onResetHeldItemCharges,
} from '../../store/thunks/playerSheetThunks';
import '../../style/held_items.css';

/**
 * Wands, rods and staffs at the foot of the attacks card.
 *
 * They belong on this card because a held item is one of the things a
 * character can *do* on their turn — the card already lists what they can
 * swing, and pointing a wand is the same kind of decision. They were
 * previously routed to the four `other` accessory slots, where nothing about
 * them appeared at all.
 *
 * **Three shapes, not one.** A wand is a single spell spending one charge; a
 * staff is several spells each with its own cost against a shared pool of
 * fifty; a rod casts nothing and is usually a per-day allowance. Forcing them
 * through one row would have flattened exactly the differences that matter, so
 * each gets its own.
 *
 * Rules: dnd-rules/magic-items.md.
 */

/** The counter every held item carries, with its spend and refill buttons. */
function Charges({ item, onSpend, onReset }) {
  const over = item.spent > item.maxCharges;
  if (item.maxCharges <= 0) return null;
  return (
    <span className="held-item-charges">
      <span className={`held-item-count${over ? ' is-over' : ''}`}>
        {Math.max(0, item.remaining)}<span className="held-item-sep">/</span>{item.maxCharges}
      </span>
      <IconButton
        icon="add"
        ghost
        size="sm"
        title={`Give back a charge to ${item.name}`}
        aria-label={`Give back a charge to ${item.name}`}
        disabled={item.spent === 0}
        onClick={() => onSpend(-1)}
      />
      <IconButton
        icon="restart_alt"
        ghost
        size="sm"
        title={`Refill ${item.name}`}
        aria-label={`Refill ${item.name}`}
        disabled={item.spent === 0}
        onClick={onReset}
      />
    </span>
  );
}

/** One castable spell: its name, what it costs this item, and the spend button. */
function SpellRow({ item, spell, onSpend }) {
  return (
    <div className="held-item-spell">
      <span className="held-item-spell-name">
        <SpellLink link={spell.link}>{spell.name}</SpellLink>
        {spell.note && <span className="sh-faint held-item-note"> ({spell.note})</span>}
      </span>
      <span className="held-item-spell-meta">
        {spell.casterLevel > 0 && (
          <span className="sh-faint held-item-cl">CL {spell.casterLevel}</span>
        )}
        {/* Only worth saying when it is not the usual one charge. */}
        {spell.charges > 1 && <Pill tone="ghost">{spell.charges} charges</Pill>}
        {!spell.usable && (
          <InfoPopover label="Not on your spell list">
            <p>{spell.reason}.</p>
            <p>
              A wand or staff is a <b>spell trigger</b> item: anyone with the
              spell on their class spell list can use it, whatever their level —
              but the spell has to be on the list. Yours does not have it.
            </p>
            <p>
              <b>Use Magic Device</b> emulates the missing class, at DC 20. The
              button still works: the table decides.
            </p>
          </InfoPopover>
        )}
        <IconButton
          icon="bolt"
          ghost
          size="sm"
          title={`Cast ${spell.name}`}
          aria-label={`Cast ${spell.name} from ${item.name}`}
          onClick={() => onSpend(spell.charges)}
        />
      </span>
    </div>
  );
}

function HeldItem({ item, onSpend, onReset }) {
  const unusable = item.spells.length > 0 && item.spells.every((s) => !s.usable);
  return (
    <div className={`held-item${item.isSecondarySet ? ' is-stowed' : ''}`}>
      <div className="held-item-head">
        <span className="held-item-name">
          <Icon name="auto_fix_high" size={18} className="sh-faint" />
          <SpellLink link={`items/${item.itemType}/${item.link}`}>
            <span className="sh-display">{item.name}</span>
          </SpellLink>
          {item.isSecondarySet && (
            <span className="sh-faint held-item-stowed-note">second set</span>
          )}
        </span>
        <Charges item={item} onSpend={onSpend} onReset={onReset} />
      </div>

      {item.spells.map((spell) => (
        <SpellRow key={spell.link} item={item} spell={spell} onSpend={onSpend} />
      ))}

      {/* A rod casts nothing. The metamagic ones lend a feat instead, which is
          the whole of what they do and belongs on the row. */}
      {item.itemType === 'Rod' && item.metamagicFeat && (
        <div className="held-item-spell">
          <span className="held-item-spell-name">{item.metamagicFeat}</span>
          <span className="held-item-spell-meta">
            <InfoPopover label={item.metamagicFeat}>
              <p>
                Lets you apply <b>{item.metamagicFeat}</b> to a spell as you cast
                it, <b>without raising the slot it uses</b> — which is the whole
                point of a metamagic rod.
              </p>
              <p>You need not have the feat, and the rod must be held.</p>
            </InfoPopover>
            <IconButton
              icon="bolt"
              ghost
              size="sm"
              title={`Use ${item.name}`}
              aria-label={`Use ${item.name}`}
              onClick={() => onSpend(1)}
            />
          </span>
        </div>
      )}

      {unusable && (
        <div className="sh-warn-strip held-item-warn">
          <Icon name="warning" />
          Not on your spell list — a Use Magic Device check (DC 20) would be needed
        </div>
      )}
    </div>
  );
}

export default function HeldItemsRows() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet.player);
  const held = player?.getHeldItems?.() ?? [];
  if (held.length === 0) return null;

  return (
    <div className="held-items">
      {held.map((item) => (
        <HeldItem
          key={`${item.slot}-${item.id}`}
          item={item}
          onSpend={(n) => dispatch(onSpendHeldItemCharges(item.id, n))}
          onReset={() => dispatch(onResetHeldItemCharges(item.id))}
        />
      ))}
    </div>
  );
}
