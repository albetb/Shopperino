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
import { t, tx } from '../../lib/i18n';

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
        title={tx('Give back a charge to {0}', item.name)}
        aria-label={tx('Give back a charge to {0}', item.name)}
        disabled={item.spent === 0}
        onClick={() => onSpend(-1)}
      />
      <IconButton
        icon="restart_alt"
        ghost
        size="sm"
        title={tx('Refill {0}', item.name)}
        aria-label={tx('Refill {0}', item.name)}
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
        {spell.charges > 1 && <Pill tone="ghost">{tx('{0} charges', spell.charges)}</Pill>}
        {!spell.usable && (
          <InfoPopover label={t('Not on your spell list')}>
            <p>{spell.reason}.</p>
            <p>
              {tx(
                'A wand or staff is a {0} item: anyone with the spell on their class spell list can use it, whatever their level — but the spell has to be on the list. Yours does not have it.',
                <b>{t('spell trigger')}</b>
              )}
            </p>
            <p>
              {tx(
                '{0} emulates the missing class, at DC 20. The button still works: the table decides.',
                <b>{t('Use Magic Device')}</b>
              )}
            </p>
          </InfoPopover>
        )}
        <IconButton
          icon="bolt"
          ghost
          size="sm"
          title={tx('Cast {0}', spell.name)}
          aria-label={tx('Cast {0} from {1}', spell.name, item.name)}
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
            <span className="sh-faint held-item-stowed-note">{t('second set')}</span>
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
                {tx(
                  'Lets you apply {0} to a spell as you cast it, {1} — which is the whole point of a metamagic rod.',
                  <b>{item.metamagicFeat}</b>,
                  <b>{t('without raising the slot it uses')}</b>
                )}
              </p>
              <p>{t('You need not have the feat, and the rod must be held.')}</p>
            </InfoPopover>
            <IconButton
              icon="bolt"
              ghost
              size="sm"
              title={tx('Use {0}', item.name)}
              aria-label={tx('Use {0}', item.name)}
              onClick={() => onSpend(1)}
            />
          </span>
        </div>
      )}

      {unusable && (
        <div className="sh-warn-strip held-item-warn">
          <Icon name="warning" />
          {tx('Not on your spell list — a {0} check (DC 20) would be needed', t('Use Magic Device'))}
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
