import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TrackerCard from './tracker_card';
import TrackerRow from './tracker_row';
import Card from '../common/Card';
import useLongPress from '../hooks/useLongPress';
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
 * **Not a monk card.** Stunning Fist is a general feat: a monk may take it as a
 * 1st-level bonus feat and gets an attempt per class level, and anyone else may
 * spend an ordinary feat on it and gets one per four levels. The card follows
 * the feat rather than the class, so it is registered under `FEAT_FEATURE_CARDS`
 * in class_feature_cards.jsx and reaches a fighter or a ranger too.
 *
 * Ki strike has no counter of its own, so it rides along as a pill here — and
 * only for the monk, since only a monk has one.
 */
export function StunningFistCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  if (!player?.hasStunningFist?.()) return null;

  const max = player.getStunningFistMax();
  const kiStrike = player.getKiStrikeTier();
  /* A monk counts attempts by class level; everyone else by four levels, so
     the first arrives at 4th and the card honestly shows none before that. */
  const isMonkAllowance = (player.getClass?.() ?? '') === 'Monk';

  return (
    <TrackerCard
      title="Stunning fist"
      collapseKey="stunningFist"
      used={player.getClassFeatureUsed('stunningFist')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('stunningFist', delta))}
      onReset={() => dispatch(onResetClassFeature('stunningFist'))}
      note={max === 0 ? 'One attempt per four levels — the first arrives at 4th.' : undefined}
      action={
        <InfoPopover label="Stunning fist">
          <p>
            Declared <b>before</b> the attack roll, at most once per round, and
            only on an unarmed melee attack. It costs one attempt whether or not
            the attack lands.
          </p>
          <p>
            On a hit, the target makes a <b>Fortitude save (DC {player.getStunningFistDc()})</b>{' '}
            — 10 + half your character level + your Wisdom modifier. On a failure
            it is <b>stunned for one round</b>: it loses its next action, is
            denied its Dexterity bonus to AC, and takes a further −2 to AC.
          </p>
          <p>
            {isMonkAllowance
              ? 'A monk attempts it once per day for each monk level.'
              : 'Outside the monk class the feat allows one attempt per day for every four levels.'}{' '}
            Constructs, oozes, plants, undead, incorporeal creatures and anything
            immune to critical hits cannot be stunned.
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
 * Every monk ability with a use to spend: wholeness of body at 7th, then
 * abundant step, quivering palm and empty body between 12th and 19th.
 *
 * One card rather than four. Each arrives at its own level, each is spent
 * perhaps once in a session, and four cards for four counters would push the
 * rest of the combat page off the screen for the only characters that have
 * them. They share `TrackerRow` with the single-ability cards, so a use is
 * spent and displayed identically either way, and all of them clear on a long
 * rest along with everything else.
 *
 * Tongue of the sun and moon is deliberately not here: it has no use to spend,
 * so it is reported on the language card, beside the languages it makes moot.
 */
export function MonkAbilitiesCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const collapsed = useSelector(
    (state) => state.playerSheet?.combatPageCardsCollapsed?.monkAbilities ?? false
  );
  const heal = useCallback(
    (amount) => dispatch(onUseWholenessOfBody(amount)),
    [dispatch]
  );
  /* Hooks run before the early return, so the long press is wired whether or
     not this monk has the pool; the button it belongs to simply may not exist. */
  const longPressHeal = useLongPress(() => heal(10), () => heal(1), { delay: 400 });
  if (!player?.hasMonkAbilities?.()) return null;

  const wholeness = player.getWholenessOfBodyMax();
  const abundantStep = player.getAbundantStepMax();
  const quiveringPalm = player.getQuiveringPalmMax();
  const emptyBody = player.getEmptyBodyMax();
  /* Only full health disables healing. An exhausted pool does not: per the
     non-enforcing rule in CLAUDE.md going over is flagged, never blocked. */
  const atFullHealth = player.getCurrentHp() >= player.getMaxLife();

  const spend = (key) => (delta) => dispatch(onUseClassFeature(key, delta));
  const restore = (key) => () => dispatch(onResetClassFeature(key));

  return (
    <Card
      title="Monk abilities"
      className="sh-card--head-spread"
      onHeadClick={() => dispatch(setCombatPageCardCollapsed({ key: 'monkAbilities', value: !collapsed }))}
      action={
        <IconButton
          icon={collapsed ? 'expand_more' : 'expand_less'}
          ghost size="sm"
          onClick={() => dispatch(setCombatPageCardCollapsed({ key: 'monkAbilities', value: !collapsed }))}
          aria-label="Toggle monk abilities"
        />
      }
    >
      {!collapsed && (
        <div className="sh-stack monk-abilities">
          {wholeness > 0 && (
            <div className="monk-ability">
              <TrackerRow
                name="wholeness of body"
                label="Wholeness of body"
                unit="hp"
                used={player.getClassFeatureUsed('wholenessOfBody')}
                max={wholeness}
                onReset={restore('wholenessOfBody')}
                note={
                  atFullHealth
                    ? 'Already at full health — nothing to heal.'
                    : 'Heals the monk alone, in any split across the day.'
                }
                spendControl={
                  <IconButton
                    icon="healing"
                    ghost
                    size="sm"
                    /* Disabled buttons still receive pointer events, so the
                       long-press handlers must not be wired when it is off. */
                    {...(atFullHealth ? {} : longPressHeal)}
                    disabled={atFullHealth}
                    title={atFullHealth ? 'Already at full health' : 'Heal 1 hp (hold for 10)'}
                    aria-label="Heal one hit point"
                  />
                }
                action={
                  <InfoPopover label="Wholeness of body">
                    <p>
                      A pool of <b>{wholeness} hit points</b> — twice your monk
                      level — that you may heal <b>yourself</b> with, in any split
                      across the day.
                    </p>
                    <p>
                      Each press moves one point out of the pool and onto your hit
                      points in the same action, so the two can never drift apart.
                      Hold for ten.
                    </p>
                  </InfoPopover>
                }
              />
            </div>
          )}

          {abundantStep > 0 && (
            <div className="monk-ability">
              <TrackerRow
                name="abundant step"
                label="Abundant step"
                used={player.getClassFeatureUsed('abundantStep')}
                max={abundantStep}
                onUse={spend('abundantStep')}
                onReset={restore('abundantStep')}
                action={
                  <InfoPopover label="Abundant step">
                    <p>
                      Once a day, teleport as{' '}
                      <SpellLink link="spells#dimension-door">dimension door</SpellLink>,
                      at <b>caster level {player.getAbundantStepCasterLevel()}</b> — half
                      your monk level. It is a spell-like ability, so the range and
                      everything it can carry are the spell&apos;s.
                    </p>
                  </InfoPopover>
                }
              />
            </div>
          )}

          {quiveringPalm > 0 && (
            <div className="monk-ability">
              <TrackerRow
                name="quivering palm"
                label="Quivering palm"
                used={player.getClassFeatureUsed('quiveringPalm')}
                max={quiveringPalm}
                onUse={spend('quiveringPalm')}
                onReset={restore('quiveringPalm')}
                action={
                  <InfoPopover label="Quivering palm">
                    <p>
                      Declare it, then land an <b>unarmed strike</b>. At any time in
                      the next <b>{player.getQuiveringPalmWindowDays()} days</b> you may
                      will the target dead: it makes a{' '}
                      <b>Fortitude save (DC {player.getQuiveringPalmDc()})</b> or dies.
                    </p>
                    <p>
                      Only one victim at a time — declaring it again releases the last.
                      Constructs, oozes, plants, undead and incorporeal creatures are
                      immune, as is anything with more Hit Dice than your monk level.
                    </p>
                    <p>
                      This use refreshes <b>weekly</b>, not with a night&apos;s rest,
                      so a long rest leaves the counter alone — restore it by hand
                      when the week turns.
                    </p>
                  </InfoPopover>
                }
              />
            </div>
          )}

          {emptyBody > 0 && (
            <div className="monk-ability">
              <TrackerRow
                name="empty body"
                label="Empty body"
                unit="rounds"
                used={player.getClassFeatureUsed('emptyBody')}
                max={emptyBody}
                onUse={spend('emptyBody')}
                onReset={restore('emptyBody')}
                action={
                  <InfoPopover label="Empty body">
                    <p>
                      Become ethereal as{' '}
                      <SpellLink link="spells#etherealness">etherealness</SpellLink>{' '}
                      for <b>one round per monk level each day</b>, and the rounds may
                      be split across as many separate uses as you like.
                    </p>
                  </InfoPopover>
                }
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
