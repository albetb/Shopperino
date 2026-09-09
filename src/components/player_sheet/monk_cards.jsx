import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { t, tx } from '../../lib/i18n';
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
      title={t('Bonus feats')}
      className="sh-card--head-spread"
      eyebrow={tx('{0} of {1} chosen', chosenCount, levels.length)}
      action={
        <span className="sh-row-h" style={{ gap: 'var(--space-1)' }}>
          <InfoPopover label={t('Monk bonus feats')}>
            <p>
              {tx(
                'At 1st, 2nd and 6th level a monk takes one feat from a pair. They are granted by the class: they {0} and cost nothing from either feat budget.',
                <b>{t('ignore their normal prerequisites')}</b>
              )}
            </p>
            <p>
              {t('The two options at a level are exclusive — one or the other, never both. The middle position of each slider leaves the choice open.')}
            </p>
          </InfoPopover>
          <IconButton
            icon={collapsed ? 'expand_more' : 'expand_less'}
            ghost size="sm"
            onClick={() => dispatch(setCombatPageCardCollapsed({ key: 'monkBonusFeats', value: !collapsed }))}
            aria-label={t('Toggle bonus feats')}
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
                <span className="sh-eyebrow">{tx('Level {0}', level)}</span>
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
                    leftLabel={tx('Take {0} at level {1}', options[0], level)}
                    rightLabel={tx('Take {0} at level {1}', options[1], level)}
                    centerLabel={tx('Take neither at level {0}', level)}
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
      title={t('Stunning fist')}
      collapseKey="stunningFist"
      used={player.getClassFeatureUsed('stunningFist')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('stunningFist', delta))}
      onReset={() => dispatch(onResetClassFeature('stunningFist'))}
      note={max === 0 ? t('One attempt per four levels — the first arrives at 4th.') : undefined}
      action={
        <InfoPopover label={t('Stunning fist')}>
          <p>
            {tx(
              'Declared {0}, at most once per round, and only on an unarmed melee attack. It costs one attempt whether or not the attack lands.',
              <b>{t('before the attack roll')}</b>
            )}
          </p>
          <p>
            {tx(
              'On a hit, the target makes a {0} — 10 + half your character level + your Wisdom modifier. On a failure it is {1}: it loses its next action, is denied its Dexterity bonus to AC, and takes a further −2 to AC.',
              <b>{tx('{0} (DC {1})', t('Fortitude save'), player.getStunningFistDc())}</b>,
              <b>{t('stunned for one round')}</b>
            )}
          </p>
          <p>
            {isMonkAllowance
              ? t('A monk attempts it once per day for each monk level.')
              : t('Outside the monk class the feat allows one attempt per day for every four levels.')}{' '}
            {t('Constructs, oozes, plants, undead, incorporeal creatures and anything immune to critical hits cannot be stunned.')}
          </p>
          <p>{t('The attack itself deals its damage normally either way.')}</p>
        </InfoPopover>
      }
    >
      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="accent" icon="shield_person">
          {tx('{0} DC {1}', t('Fortitude'), player.getStunningFistDc())}
        </Pill>
        {kiStrike && (
          <Pill tone="accent" icon="auto_awesome">{tx('Ki strike: {0}', kiStrike)}</Pill>
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
      title={t('Monk abilities')}
      className="sh-card--head-spread"
      onHeadClick={() => dispatch(setCombatPageCardCollapsed({ key: 'monkAbilities', value: !collapsed }))}
      action={
        <IconButton
          icon={collapsed ? 'expand_more' : 'expand_less'}
          ghost size="sm"
          onClick={() => dispatch(setCombatPageCardCollapsed({ key: 'monkAbilities', value: !collapsed }))}
          aria-label={t('Toggle monk abilities')}
        />
      }
    >
      {!collapsed && (
        <div className="sh-stack monk-abilities">
          {wholeness > 0 && (
            <div className="monk-ability">
              <TrackerRow
                name="wholeness of body"
                label={t('Wholeness of body')}
                unit={t('hp')}
                used={player.getClassFeatureUsed('wholenessOfBody')}
                max={wholeness}
                onReset={restore('wholenessOfBody')}
                note={
                  atFullHealth
                    ? t('Already at full health — nothing to heal.')
                    : t('Heals the monk alone, in any split across the day.')
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
                    title={atFullHealth ? t('Already at full health') : t('Heal 1 hp (hold for 10)')}
                    aria-label={t('Heal one hit point')}
                  />
                }
                action={
                  <InfoPopover label={t('Wholeness of body')}>
                    <p>
                      {tx(
                        'A pool of {0} — twice your monk level — that you may heal {1} with, in any split across the day.',
                        <b>{tx('{0} hit points', wholeness)}</b>,
                        <b>{t('yourself')}</b>
                      )}
                    </p>
                    <p>
                      {t('Each press moves one point out of the pool and onto your hit points in the same action, so the two can never drift apart. Hold for ten.')}
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
                label={t('Abundant step')}
                used={player.getClassFeatureUsed('abundantStep')}
                max={abundantStep}
                onUse={spend('abundantStep')}
                onReset={restore('abundantStep')}
                action={
                  <InfoPopover label={t('Abundant step')}>
                    <p>
                      {tx(
                        "Once a day, teleport as {0}, at {1} — half your monk level. It is a spell-like ability, so the range and everything it can carry are the spell's.",
                        <SpellLink link="spells#dimension-door">{t('dimension door')}</SpellLink>,
                        <b>{tx('caster level {0}', player.getAbundantStepCasterLevel())}</b>
                      )}
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
                label={t('Quivering palm')}
                used={player.getClassFeatureUsed('quiveringPalm')}
                max={quiveringPalm}
                onUse={spend('quiveringPalm')}
                onReset={restore('quiveringPalm')}
                action={
                  <InfoPopover label={t('Quivering palm')}>
                    <p>
                      {tx(
                        'Declare it, then land an {0}. At any time in the next {1} you may will the target dead: it makes a {2} or dies.',
                        <b>{t('unarmed strike')}</b>,
                        <b>{tx('{0} days', player.getQuiveringPalmWindowDays())}</b>,
                        <b>{tx('{0} (DC {1})', t('Fortitude save'), player.getQuiveringPalmDc())}</b>
                      )}
                    </p>
                    <p>
                      {t('Only one victim at a time — declaring it again releases the last. Constructs, oozes, plants, undead and incorporeal creatures are immune, as is anything with more Hit Dice than your monk level.')}
                    </p>
                    <p>
                      {tx(
                        "This use refreshes {0}, not with a night's rest, so a long rest leaves the counter alone — restore it by hand when the week turns.",
                        <b>{t('weekly')}</b>
                      )}
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
                label={t('Empty body')}
                unit={t('rounds')}
                used={player.getClassFeatureUsed('emptyBody')}
                max={emptyBody}
                onUse={spend('emptyBody')}
                onReset={restore('emptyBody')}
                action={
                  <InfoPopover label={t('Empty body')}>
                    <p>
                      {tx(
                        'Become ethereal as {0} for {1}, and the rounds may be split across as many separate uses as you like.',
                        <SpellLink link="spells#etherealness">{t('etherealness')}</SpellLink>,
                        <b>{t('one round per monk level each day')}</b>
                      )}
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
