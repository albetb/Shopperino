import { useDispatch, useSelector } from 'react-redux';
import TrackerCard from './tracker_card';
import Pill from '../common/Pill';
import Switch from '../common/Switch';
import {
  onUseClassFeature,
  onResetClassFeature,
  onToggleRage,
} from '../../store/thunks/playerSheetThunks';

const fmt = (n) => `${n >= 0 ? '+' : ''}${n}`;

/**
 * Barbarian rage: the day's uses, the on/off stance and everything the stance
 * currently changes.
 *
 * Every number here comes from the Player model — the card only arranges them.
 * The toggle spends a use on the way in and applies the post-rage fatigue on
 * the way out, so it is the one control a player needs during a fight.
 */
export default function RageCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  if (!player?.getRageTier?.()) return null;

  const tier = player.getRageTier();
  const raging = player.isRaging();
  const bonuses = player.getRageTierBonuses();

  return (
    <TrackerCard
      title="Rage"
      eyebrow={tier === 'rage' ? undefined : tier}
      collapseKey="rage"
      used={player.getClassFeatureUsed('rage')}
      max={player.getRageUsesMax()}
      onUse={(delta) => dispatch(onUseClassFeature('rage', delta))}
      onReset={() => dispatch(onResetClassFeature('rage'))}
      action={
        <Switch
          checked={raging}
          aria-label={raging ? 'End rage' : 'Enter rage'}
          onChange={() => dispatch(onToggleRage())}
        />
      }
    >
      <div className="tracker-card-row tracker-card-meta">
        <Pill tone={raging ? 'danger' : 'ghost'} icon={raging ? 'local_fire_department' : undefined}>
          {raging ? 'Raging' : 'Calm'}
        </Pill>
        <Pill tone={raging ? 'accent' : 'default'}>
          {player.getRageDuration()} rounds
        </Pill>
        {/* Damage reduction is not a rage benefit and does not belong here —
            it shows once, on the hit points card, alongside the HP it protects. */}
      </div>

      <div className="tracker-card-row tracker-card-meta">
        <Pill tone={raging ? 'accent' : 'ghost'}>{fmt(bonuses.str)} Str</Pill>
        <Pill tone={raging ? 'accent' : 'ghost'}>{fmt(bonuses.con)} Con</Pill>
        <Pill tone={raging ? 'accent' : 'ghost'}>{fmt(bonuses.will)} Will</Pill>
        <Pill tone={raging ? 'warn' : 'ghost'}>{fmt(bonuses.ac)} AC</Pill>
        <Pill tone={raging ? 'accent' : 'ghost'}>{fmt(player.getRageTempHp())} HP</Pill>
      </div>

      <span className="sh-faint tracker-card-note">
        {player.hasTirelessRage()
          ? 'Tireless rage: no fatigue when the rage ends.'
          : 'Fatigued for the rest of the encounter when the rage ends.'}
      </span>
    </TrackerCard>
  );
}
