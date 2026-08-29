import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TrackerCard from './tracker_card';
import useLongPress from '../hooks/useLongPress';
import Card from '../common/Card';
import Pill from '../common/Pill';
import TriSwitch from '../common/TriSwitch';
import InfoPopover from '../common/InfoPopover';
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
 * A level's pair is one choice with three answers, so it is one control: a
 * three-position slider, the two feats at its ends and "neither" in the middle.
 * Two independent switches said the same thing less honestly — nothing in them
 * showed that turning one on turns the other off, and "both off" read as an
 * accident rather than as the legitimate undecided state it is.
 */
/** The chosen half of a pair reads as chosen; the other dims out of the way. */
function featNameClass(chosen, feat) {
  if (!chosen) return 'monk-bonus-option-name';
  return chosen === feat
    ? 'monk-bonus-option-name is-chosen'
    : 'monk-bonus-option-name is-passed-over';
}

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
        <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>
          <InfoPopover label="Monk bonus feats">
            <p>
              At 1st, 2nd and 6th level a monk takes one feat from a pair. They
              are granted by the class: they <b>ignore their normal
              prerequisites</b> and cost nothing from either feat budget.
            </p>
            <p>
              The two options at a level are exclusive — one or the other, never
              both. The middle position of each slider leaves the choice open.
            </p>
          </InfoPopover>
          <IconButton
            icon={collapsed ? 'expand_more' : 'expand_less'}
            ghost size="sm"
            onClick={() => dispatch(setCombatPageCardCollapsed({ key: 'monkBonusFeats', value: !collapsed }))}
            aria-label="Toggle bonus feats"
          />
        </span>
      }
    >
      {!collapsed && (
        <div className="sh-stack monk-bonus-feats">
          {levels.map((level) => {
            const options = player.getMonkBonusFeatOptions(level);
            const chosen = player.getMonkBonusFeat(level);
            /* Every level in the SRD offers exactly two. A malformed entry
               would otherwise reach TriSwitch as an undefined side. */
            if (options.length < 2) return null;
            return (
              <div key={level} className="monk-bonus-level">
                <span className="sh-eyebrow">Level {level}</span>
                <div className="monk-bonus-pair">
                  {/* Wrapped: SpellLink sets text-align inline, so the side a
                      name sits on has to be decided by its container. */}
                  <span className="monk-bonus-side monk-bonus-side--left">
                    <SpellLink link={`feats#${slug(options[0])}`}>
                      <span className={featNameClass(chosen, options[0])}>{options[0]}</span>
                    </SpellLink>
                  </span>
                  <TriSwitch
                    value={chosen}
                    leftValue={options[0]}
                    rightValue={options[1]}
                    leftLabel={`Take ${options[0]} at level ${level}`}
                    rightLabel={`Take ${options[1]} at level ${level}`}
                    centerLabel={`Take neither at level ${level}`}
                    onChange={(next) => dispatch(onSetMonkBonusFeat(level, next))}
                  />
                  <span className="monk-bonus-side">
                    <SpellLink link={`feats#${slug(options[1])}`}>
                      <span className={featNameClass(chosen, options[1])}>{options[1]}</span>
                    </SpellLink>
                  </span>
                </div>
              </div>
            );
          })}
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

  return (
    <TrackerCard
      title="Stunning fist"
      collapseKey="stunningFist"
      used={player.getClassFeatureUsed('stunningFist')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('stunningFist', delta))}
      onReset={() => dispatch(onResetClassFeature('stunningFist'))}
      action={
        <InfoPopover label="Stunning fist">
          <p>
            Declared <b>before</b> the attack roll, at most once per round, and
            only on a melee attack. It costs one attempt whether or not the
            attack lands.
          </p>
          <p>
            On a hit, the target makes a <b>Fortitude save (DC {player.getStunningFistDc()})</b>{' '}
            — 10 + half your monk level + your Wisdom modifier. On a failure it
            is <b>stunned for one round</b>: it loses its next action, is denied
            its Dexterity bonus to AC, and takes a further −2 to AC.
          </p>
          <p>The attack itself deals its damage normally either way.</p>
        </InfoPopover>
      }
    >
      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="accent" icon="shield_person">
          Fortitude DC {player.getStunningFistDc()}
        </Pill>
        {kiStrike && (
          <Pill tone="accent" icon="auto_awesome">Ki strike: {kiStrike}</Pill>
        )}
      </div>
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
