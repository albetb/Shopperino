import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
 */
export function SmiteEvilCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const max = player?.getSmiteEvilMax?.() ?? 0;
  if (max <= 0) return null;

  return (
    <TrackerCard
      title="Smite evil"
      collapseKey="smiteEvil"
      used={player.getClassFeatureUsed('smiteEvil')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('smiteEvil', delta))}
      onReset={() => dispatch(onResetClassFeature('smiteEvil'))}
      action={
        <InfoPopover label="Smite evil">
          <p>
            Declared <b>before</b> the attack roll, as part of a single melee
            attack. It adds <b>{fmt(player.getSmiteEvilAttackBonus())}</b> to the
            attack — your Charisma modifier — and{' '}
            <b>{fmt(player.getSmiteEvilDamageBonus())}</b> to the damage, one
            point per paladin level.
          </p>
          <p>
            The use is <b>spent either way</b>: it is wasted on a miss, and
            wasted entirely on a target that turns out not to be evil.
          </p>
        </InfoPopover>
      }
    >
      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="accent" icon="swords">
          {fmt(player.getSmiteEvilAttackBonus())} attack
        </Pill>
        <Pill tone="accent">{fmt(player.getSmiteEvilDamageBonus())} damage</Pill>
      </div>
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
      title="Lay on hands"
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
          title="Give 1 hp (hold for 10)"
          aria-label="Give one hit point"
        />
      }
      note="A standard action by touch, split however you like across the day. The
        same points deal damage to undead instead, as a touch attack with no save."
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
      title="Remove disease"
      eyebrow="per week"
      collapseKey="removeDisease"
      used={player.getClassFeatureUsed('removeDisease')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('removeDisease', delta))}
      onReset={() => dispatch(onResetClassFeature('removeDisease'))}
      action={
        <InfoPopover label="Remove disease">
          <p>
            Casts the spell{' '}
            {/* The link survives the move: the spell's own range, duration and
                save are what a paladin actually needs from this card. */}
            <SpellLink link={getFeatureSpell('remove disease').link}>
              {getFeatureSpell('remove disease').name}
            </SpellLink>
            , at a caster level equal to your paladin level.
          </p>
          <p>
            These uses refresh <b>weekly</b>, not with a night&apos;s rest, so a
            long rest leaves the counter alone — reset it by hand when the week
            turns.
          </p>
        </InfoPopover>
      }
    />
  );
}
