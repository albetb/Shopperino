import { useState } from 'react';
import { useSelector } from 'react-redux';
import Card from '../common/Card';
import Pill from '../common/Pill';
import Button from '../common/Button';
import Icon from '../common/Icon';
import SpellLink from '../common/spell_link';
import useCardCollapse from './hooks/useCardCollapse';
import PotionUsePopover from './potion_use_popover';
import '../../style/potions.css';

/**
 * The potions and oils in the bag, on the combat page under the equipment card.
 *
 * A potion is **not equipment**: it lives in the inventory, it gets drunk once,
 * and the count goes down — so it never competes for one of the four accessory
 * slots. It earns a place on this card because drinking one is a thing a
 * character *does* on their turn, which is the question this page answers.
 *
 * Absent entirely when the character carries none, in the same way the
 * equipment card is: an empty card here is only wasted lines.
 *
 * The row is deliberately quiet — name, count, and one button. Everything
 * about what the potion does lives behind that button, because a bag of twelve
 * potions listing twelve effects inline is a wall nobody reads.
 */
export default function PotionsCard() {
  const player = useSelector((state) => state.playerSheet?.player);
  const [collapsed, toggle] = useCardCollapse('potions', 'potions');
  const [using, setUsing] = useState(null);

  const potions = player?.getCarriedPotions?.() ?? [];
  if (potions.length === 0) return null;

  /* An oil needs somewhere to go, so the list of legal targets is resolved
     before the box opens — that way the box can say "nothing wielded" instead
     of offering an empty picker. */
  const targetsFor = (potion) => (
    potion.kind === 'oil' ? (player.getOilTargets?.(potion.target) ?? []) : []
  );

  /* Lesser restoration repairs one damaged ability, so the box needs to know
     which ones are damaged before it can ask. */
  const damagedAbilities = (player.getConditions?.() ?? [])
    .filter((c) => c.name === 'Ability Damaged' && c.ability)
    .map((c) => ({ ability: c.ability, amount: Number(c.amount) || 0 }));

  return (
    <>
      <Card
        title="Potions"
        className="sh-card--head-spread"
        onHeadClick={() => toggle.props.onClick()}
        action={toggle}
      >
        {!collapsed && (
          <div className="potions-list">
            {potions.map((potion) => (
              <div className="potion-row" key={potion.name}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={potion.kind === 'oil' ? 'colors' : 'local_bar'}
                  onClick={() => setUsing(potion)}
                  aria-label={`Use ${potion.name}`}
                >
                  Use
                </Button>
                <span className="potion-row-name">
                  <SpellLink link={`items/Potion/${potion.link}`}>
                    <span className="sh-display">{potion.name}</span>
                  </SpellLink>
                  <span className="sh-faint potion-row-desc">{potion.description}</span>
                </span>
                <Pill tone={potion.number > 1 ? 'accent' : 'ghost'}>{potion.number}</Pill>
              </div>
            ))}
          </div>
        )}
      </Card>

      {using && (
        <PotionUsePopover
          potion={using}
          targets={targetsFor(using)}
          damagedAbilities={damagedAbilities}
          onClose={() => setUsing(null)}
        />
      )}
    </>
  );
}

/**
 * The effects currently running, as removable pills.
 *
 * Rendered inside the conditions section rather than as a card of its own,
 * because a running potion is the same kind of fact as a condition — something
 * temporarily true about the character that the reader needs beside their hit
 * points, not two cards away.
 *
 * Nothing expires on its own: there is no combat clock for "1 min./level" to
 * tick against, so an effect ends when the player taps its x or when they rest.
 */
export function ActiveEffectPills({ onRemove }) {
  const player = useSelector((state) => state.playerSheet?.player);
  const effects = player?.getResolvedEffects?.() ?? [];
  const warnings = player?.getPotionStackingWarnings?.() ?? [];
  if (effects.length === 0) return null;

  return (
    <div className="potion-effects">
      <div className="potion-effects-pills">
        {effects.map((effect) => (
          <span className="cond-pill cond-pill--positive" key={`${effect.name}:${effect.index}`}>
            <span className="cond-pill-label potion-effect-label">
              {effect.oil && <Icon name="colors" size={12} />}
              {/* The name opens the spell that is running. "What does haste
                  actually do again" is the question a pill provokes, and the
                  answer was two taps away on the potions card below. */}
              <SpellLink link={effect.infoRef}>{effect.label}</SpellLink>
              {/* An applied oil names what it is on, so two oils on two
                  different weapons stay distinguishable. */}
              {effect.target && <span className="potion-effect-target"> · {effect.targetName || effect.target}</span>}
            </span>
            <button
              type="button"
              className="cond-pill-x"
              onClick={() => onRemove(effect.index)}
              aria-label={`End ${effect.label}`}
            >
              <Icon name="close" size={12} />
            </button>
          </span>
        ))}
      </div>

      {/* Computed, never enforced: the sheet adds both bonuses and says the sum
          is suspect, rather than silently dropping one. */}
      {warnings.map((w) => (
        <div className="sh-warn-strip potion-effects-warn" key={`${w.stat}:${w.type}`}>
          <Icon name="warning" size={14} />
          {w.labels.join(' and ')} both give a {w.type} bonus — in 3.5 only the
          larger applies, but both are counted here.
        </div>
      ))}
    </div>
  );
}
