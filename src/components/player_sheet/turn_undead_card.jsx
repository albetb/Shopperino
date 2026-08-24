import { useDispatch, useSelector } from 'react-redux';
import TrackerCard from './tracker_card';
import Pill from '../common/Pill';
import {
  onUseClassFeature,
  onResetClassFeature,
} from '../../store/thunks/playerSheetThunks';

const fmt = (n) => `${n >= 0 ? '+' : ''}${n}`;

/**
 * Turn or rebuke undead — one card for both classes that have it.
 *
 * A cleric turns from 1st level at their own level; a paladin from 4th, three
 * levels lower. An evil cleric rebukes and commands rather than turns and
 * destroys, so the card renames itself accordingly.
 */
export default function TurnUndeadCard() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  if (!player?.canTurnUndead?.()) return null;

  const rebukes = player.rebukesUndead();
  const verb = rebukes ? 'Rebuke' : 'Turn';
  const effectiveLevel = player.getTurnUndeadEffectiveLevel();
  const checkBonus = player.getTurnUndeadCheckBonus();
  const damage = player.getTurnUndeadDamage();
  const destroyThreshold = player.getTurnUndeadDestroyThreshold();

  return (
    <TrackerCard
      title={`${verb} undead`}
      eyebrow={`Turning level ${effectiveLevel}`}
      collapseKey="turnUndead"
      used={player.getClassFeatureUsed('turnUndead')}
      max={player.getTurnUndeadAttemptsMax()}
      onUse={(delta) => dispatch(onUseClassFeature('turnUndead', delta))}
      onReset={() => dispatch(onResetClassFeature('turnUndead'))}
    >
      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="accent" icon="casino">
          Check d20 {fmt(checkBonus)}
        </Pill>
        <Pill tone="accent">{damage.formula} HD affected</Pill>
      </div>

      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="ghost">
          Highest HD: turning level {fmt(-4)} to {fmt(4)} by check result
        </Pill>
        <Pill tone={destroyThreshold > 0 ? 'danger' : 'ghost'} icon="skull">
          {rebukes ? 'Commands' : 'Destroys'} {destroyThreshold} HD or less
        </Pill>
      </div>

      <span className="sh-faint tracker-card-note">
        {rebukes
          ? `Rebuked undead cower for 10 rounds. Undead of ${destroyThreshold} HD or less are commanded instead, up to ${effectiveLevel} HD at once.`
          : `Turned undead flee for 10 rounds. Undead whose HD are at most half the turning level (${destroyThreshold}) are destroyed instead.`}
      </span>
    </TrackerCard>
  );
}
