import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TrackerCard from './tracker_card';
import useLongPress from '../hooks/useLongPress';
import Pill from '../common/Pill';
import IconButton from '../common/IconButton';
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
    >
      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="accent" icon="swords">
          {fmt(player.getSmiteEvilAttackBonus())} attack
        </Pill>
        <Pill tone="accent">{fmt(player.getSmiteEvilDamageBonus())} damage</Pill>
      </div>
      <span className="sh-faint tracker-card-note">
        Declared before the attack roll. Wasted on a miss or on a target that is not evil.
      </span>
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
      note={'Cast as the spell. These uses refresh weekly, not with a night’s rest — '
        + 'reset them by hand when the week turns.'}
    />
  );
}
