import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { t, tx } from '../../lib/i18n';
import TrackerCard from './tracker_card';
import useLongPress from '../hooks/useLongPress';
import Pill from '../common/Pill';
import IconButton from '../common/IconButton';
import InfoPopover from '../common/InfoPopover';
import SpellLink from '../common/spell_link';
import { getFeatureSpell } from '../../lib/player/featureSpells';
import {
  onUseClassFeature,
  onResetClassFeature,
} from '../../store/thunks/playerSheetThunks';

const fmt = (n) => `${n >= 0 ? '+' : ''}${n}`;

/**
 * Smite evil — a per-day use counter that also states what a smite is worth,
 * since the bonuses scale with level and Charisma and are easy to misremember.
 *
 * **Detect evil rides along here.** It is at-will from 1st level, so it has no
 * counter and would never have earned a card; but it is the ability a paladin
 * uses to answer the one question a smite depends on — *is this thing evil?* —
 * and a smite spent on a target that turns out not to be is simply lost. The
 * two belong on the same card for that reason and no other.
 */
export function SmiteEvilCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const max = player?.getSmiteEvilMax?.() ?? 0;
  if (max <= 0) return null;

  const detectEvil = player.hasDetectEvil?.() ? getFeatureSpell('Detect evil') : null;

  return (
    <TrackerCard
      title={t('Smite evil')}
      collapseKey="smiteEvil"
      used={player.getClassFeatureUsed('smiteEvil')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('smiteEvil', delta))}
      onReset={() => dispatch(onResetClassFeature('smiteEvil'))}
      action={
        <InfoPopover label={t('Smite evil')}>
          <p>
            {tx(
              'Declared {0} the attack roll, as part of a single melee attack. It adds {1} to the attack — your Charisma modifier — and {2} to the damage, one point per paladin level.',
              <b>{t('before')}</b>,
              <b>{fmt(player.getSmiteEvilAttackBonus())}</b>,
              <b>{fmt(player.getSmiteEvilDamageBonus())}</b>,
            )}
          </p>
          <p>
            {tx(
              'The use is {0}: it is wasted on a miss, and wasted entirely on a target that turns out not to be evil.',
              <b>{t('spent either way')}</b>,
            )}
          </p>
        </InfoPopover>
      }
    >
      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="accent" icon="swords">
          {tx('{0} attack', fmt(player.getSmiteEvilAttackBonus()))}
        </Pill>
        <Pill tone="accent">{tx('{0} damage', fmt(player.getSmiteEvilDamageBonus()))}</Pill>
      </div>

      {detectEvil && (
        /* Name on the left as a link into the spell, allowance on the right —
           the same shape the granted-feat rows use. */
        <div className="tracker-card-row sh-spread paladin-detect-evil">
          <SpellLink link={detectEvil.link}>
            <Pill tone="accent" icon="visibility">{detectEvil.name}</Pill>
          </SpellLink>
          <span className="sh-faint">{t('at will')}</span>
        </div>
      )}
    </TrackerCard>
  );
}

/**
 * Lay on hands — a hit point pool the paladin spends on others, so nothing is
 * healed on this sheet: each press just moves a point out of the pool. A long
 * press moves ten, since the pool runs to several times the paladin's level.
 */
export function LayOnHandsCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const spend = useCallback(
    (amount) => dispatch(onUseClassFeature('layOnHands', amount)),
    [dispatch]
  );
  const longPressSpend = useLongPress(() => spend(10), () => spend(1), { delay: 400 });

  const max = player?.getLayOnHandsMax?.() ?? 0;
  if (max <= 0) return null;

  return (
    <TrackerCard
      title={t('Lay on hands')}
      collapseKey="layOnHands"
      unit="hp"
      used={player.getClassFeatureUsed('layOnHands')}
      max={max}
      onReset={() => dispatch(onResetClassFeature('layOnHands'))}
      spendControl={
        <IconButton
          icon="remove"
          ghost
          size="sm"
          {...longPressSpend}
          title={t('Give 1 hp (hold for 10)')}
          aria-label={t('Give one hit point')}
        />
      }
      note={t('A standard action by touch, split however you like across the day. The same points deal damage to undead instead, as a touch attack with no save.')}
    />
  );
}

/**
 * Remove disease — the odd one out, a per-week counter rather than per-day.
 * The rest button clears it, since a night's rest does not.
 */
export function RemoveDiseaseCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const max = player?.getRemoveDiseaseMax?.() ?? 0;
  if (max <= 0) return null;

  return (
    <TrackerCard
      title={t('Remove disease')}
      eyebrow={t('per week')}
      collapseKey="removeDisease"
      used={player.getClassFeatureUsed('removeDisease')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('removeDisease', delta))}
      onReset={() => dispatch(onResetClassFeature('removeDisease'))}
      action={
        <InfoPopover label={t('Remove disease')}>
          <p>
            {/* The link survives the move: the spell's own range, duration and
                save are what a paladin actually needs from this card. */}
            {tx(
              'Casts the spell {0}, at a caster level equal to your paladin level.',
              <SpellLink link={getFeatureSpell('remove disease').link}>
                {getFeatureSpell('remove disease').name}
              </SpellLink>,
            )}
          </p>
          <p>
            {tx(
              "These uses refresh {0}, not with a night's rest, so a long rest leaves the counter alone — reset it by hand when the week turns.",
              <b>{t('weekly')}</b>,
            )}
          </p>
        </InfoPopover>
      }
    />
  );
}
