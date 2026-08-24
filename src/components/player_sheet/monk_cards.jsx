import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TrackerCard from './tracker_card';
import useLongPress from '../hooks/useLongPress';
import Card from '../common/Card';
import Pill from '../common/Pill';
import Switch from '../common/Switch';
import IconButton from '../common/IconButton';
import SpellLink from '../common/spell_link';
import { slug } from '../../lib/slugUtils';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import {
  onUseClassFeature,
  onResetClassFeature,
  onUseWholenessOfBody,
  onSetMonkBonusFeat,
} from '../../store/thunks/playerSheetThunks';
import '../../style/monk_cards.css';

/**
 * Monk bonus feats — one of two options at each of 1st, 2nd and 6th level,
 * taken without meeting the prerequisites and charged to no feat budget.
 *
 * The options at a level are mutually exclusive, so each is a switch: turning
 * one on turns the other off. Turning the active one off reopens the choice,
 * since nothing stops a monk from leaving it undecided on the sheet.
 */
export function MonkBonusFeatsCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const collapsed = useSelector(
    (state) => state.playerSheet?.combatPageCardsCollapsed?.monkBonusFeats ?? false
  );

  const levels = player?.getMonkBonusFeatLevels?.() ?? [];
  if (levels.length === 0) return null;

  const chosenCount = player.getChosenClassBonusFeats().length;

  return (
    <Card
      title="Bonus feats"
      className="sh-card--head-spread"
      eyebrow={`${chosenCount} of ${levels.length} chosen`}
      action={
        <IconButton
          icon={collapsed ? 'expand_more' : 'expand_less'}
          ghost size="sm"
          onClick={() => dispatch(setCombatPageCardCollapsed({ key: 'monkBonusFeats', value: !collapsed }))}
          aria-label="Toggle bonus feats"
        />
      }
    >
      {!collapsed && (
        <div className="sh-stack monk-bonus-feats">
          {levels.map((level) => {
            const options = player.getMonkBonusFeatOptions(level);
            const chosen = player.getMonkBonusFeat(level);
            return (
              <div key={level} className="monk-bonus-level">
                <span className="sh-eyebrow">Level {level}</span>
                {options.map((feat) => (
                  <div key={feat} className="monk-bonus-option">
                    <SpellLink link={`feats#${slug(feat)}`}>
                      <span className="monk-bonus-option-name">{feat}</span>
                    </SpellLink>
                    <Switch
                      checked={chosen === feat}
                      aria-label={`Take ${feat} at level ${level}`}
                      onChange={(value) =>
                        dispatch(onSetMonkBonusFeat(level, value ? feat : ''))}
                    />
                  </div>
                ))}
              </div>
            );
          })}
          <span className="sh-faint tracker-card-note">
            Granted by the class: they ignore their normal prerequisites and cost
            nothing from the feat budget. The two options at a level are exclusive.
          </span>
        </div>
      )}
    </Card>
  );
}

/**
 * Stunning fist — the per-day counter and the save DC, which scales with both
 * level and Wisdom and is the number the table actually needs.
 *
 * Appears only once the feat is actually held, from the bonus-feat card above
 * or taken normally. Ki strike and slow fall have no counter of their own, so
 * they ride along as pills here rather than each taking a card.
 */
export function StunningFistCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const max = player?.getStunningFistMax?.() ?? 0;
  if (max <= 0) return null;

  const kiStrike = player.getKiStrikeTier();
  const slowFall = player.getSlowFallDistance();

  return (
    <TrackerCard
      title="Stunning fist"
      collapseKey="stunningFist"
      used={player.getClassFeatureUsed('stunningFist')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('stunningFist', delta))}
      onReset={() => dispatch(onResetClassFeature('stunningFist'))}
    >
      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="accent" icon="shield_person">
          Fortitude DC {player.getStunningFistDc()}
        </Pill>
        {kiStrike && (
          <Pill tone="accent" icon="auto_awesome">Ki strike: {kiStrike}</Pill>
        )}
        {slowFall > 0 && (
          <Pill tone="success" icon="paragliding">
            Slow fall {slowFall === Infinity ? 'any height' : `${slowFall} ft`}
          </Pill>
        )}
      </div>
      <span className="sh-faint tracker-card-note">
        A stunned target loses its next action, is denied its Dexterity bonus and
        takes −2 AC for a round. One attempt per round, declared before the roll.
      </span>
    </TrackerCard>
  );
}

/**
 * Wholeness of body — a hit point pool the monk spends on themselves.
 *
 * Spending and healing are one action: each press moves a point from the pool
 * onto the monk's HP, so the two numbers can never drift apart. A long press
 * moves ten, matching the HP steppers on the hit points card. Disabled at full
 * health, where the points would simply be thrown away.
 */
export function WholenessOfBodyCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const heal = useCallback(
    (amount) => dispatch(onUseWholenessOfBody(amount)),
    [dispatch]
  );
  const longPressHeal = useLongPress(() => heal(10), () => heal(1), { delay: 400 });

  const max = player?.getWholenessOfBodyMax?.() ?? 0;
  if (max <= 0) return null;

  /* Only full health disables the button. An exhausted pool does not: per the
     non-enforcing rule in CLAUDE.md going over is flagged, never blocked. */
  const atFullHealth = player.getCurrentHp() >= player.getMaxLife();

  return (
    <TrackerCard
      title="Wholeness of body"
      collapseKey="wholenessOfBody"
      unit="hp"
      used={player.getClassFeatureUsed('wholenessOfBody')}
      max={max}
      onReset={() => dispatch(onResetClassFeature('wholenessOfBody'))}
      spendControl={
        <IconButton
          icon="healing"
          ghost
          size="sm"
          /* Disabled buttons still receive pointer events, so the long-press
             handlers must not be wired when the button is off. */
          {...(atFullHealth ? {} : longPressHeal)}
          disabled={atFullHealth}
          title={atFullHealth ? 'Already at full health' : 'Heal 1 hp (hold for 10)'}
          aria-label="Heal one hit point"
        />
      }
      note={
        atFullHealth
          ? 'Already at full health — nothing to heal.'
          : 'Heals the monk alone, in any split across the day.'
      }
    />
  );
}
