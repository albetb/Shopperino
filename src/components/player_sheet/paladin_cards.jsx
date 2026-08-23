import { useDispatch, useSelector } from 'react-redux';
import TrackerCard from './tracker_card';
import Pill from '../common/Pill';
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
 * Lay on hands — a pool rather than a use counter: the paladin spends any
 * number of points from a daily total, so the card takes a free amount.
 */
export function LayOnHandsCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const max = player?.getLayOnHandsMax?.() ?? 0;
  if (max <= 0) return null;

  return (
    <TrackerCard
      title="Lay on hands"
      variant="pool"
      unit="hp"
      used={player.getClassFeatureUsed('layOnHands')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('layOnHands', delta))}
      onReset={() => dispatch(onResetClassFeature('layOnHands'))}
    >
      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="success" icon="healing">
          {player.getLayOnHandsRemaining()} hp to give
        </Pill>
      </div>
      <span className="sh-faint tracker-card-note">
        A standard action by touch, split however you like across the day. The same
        points deal damage to undead instead, as a touch attack with no save.
      </span>
    </TrackerCard>
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
      used={player.getClassFeatureUsed('removeDisease')}
      max={max}
      onUse={(delta) => dispatch(onUseClassFeature('removeDisease', delta))}
      onReset={() => dispatch(onResetClassFeature('removeDisease'))}
    >
      <span className="sh-faint tracker-card-note">
        Cast as the spell. These uses refresh weekly, not with a night&apos;s rest —
        reset them by hand when the week turns.
      </span>
    </TrackerCard>
  );
}
