import { useDispatch, useSelector } from 'react-redux';
import TrackerCard from './tracker_card';
import Pill from '../common/Pill';
import InfoPopover from '../common/InfoPopover';
import {
  onUseClassFeature,
  onResetClassFeature,
} from '../../store/thunks/playerSheetThunks';

const fmt = (n) => `${n >= 0 ? '+' : ''}${n}`;

/**
 * How the ability resolves, from class-features.md. It lived on the card as a
 * paragraph of prose, which is reference a player reads once and then scrolls
 * past every visit after — so it moved behind the `info` button, and gained
 * the two steps the card never explained: that turning is *two* rolls, and
 * that the check decides how powerful, while the damage decides how many.
 */
function TurningRules({ rebukes, effectiveLevel, checkBonus, damage, destroyThreshold }) {
  const verbing = rebukes ? 'rebuking' : 'turning';
  return (
    <>
      <p>
        A standard action that does not provoke an attack of opportunity.
        Brandish your holy symbol and it affects undead within <b>60 ft</b>,
        in line of sight and line of effect.
      </p>
      <p><b>It takes two rolls, in this order:</b></p>
      <ul>
        <li>
          <b>The {verbing} check</b> — d20 {fmt(checkBonus)} decides <i>how
          powerful</i> an undead you can touch. Look the result up on the
          turning table: it gives the highest Hit Dice affected, from your
          {' '}{verbing} level {fmt(-4)} to {fmt(4)}.
        </li>
        <li>
          <b>{rebukes ? 'Rebuking' : 'Turning'} damage</b> — {damage.formula} is{' '}
          <i>how many</i> Hit Dice of undead you affect in total, spending it on
          the closest and weakest first. You may skip a stronger one nearby, and
          any remainder too small for the next undead is wasted.
        </li>
      </ul>
      {rebukes ? (
        <p>
          Rebuked undead cower for <b>10 rounds</b>, and attacks against them
          get +2. Any with <b>{destroyThreshold} HD or less</b> can be{' '}
          <b>commanded</b> instead — a standard action per order, holding at most{' '}
          {effectiveLevel} HD of undead at a time.
        </p>
      ) : (
        <p>
          Turned undead flee at full speed for <b>10 rounds</b>, and cower if
          cornered. Any with <b>{destroyThreshold} HD or less</b> — half your
          turning level — are <b>destroyed</b> outright instead.
        </p>
      )}
      <p>
        Coming within 10 ft of a {rebukes ? 'rebuked' : 'turned'} undead, or
        attacking it in melee, breaks the effect on that creature. Ranged
        attacks from further off do not.
      </p>
    </>
  );
}

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
      action={
        <InfoPopover label={`${verb} undead`}>
          <TurningRules
            rebukes={rebukes}
            effectiveLevel={effectiveLevel}
            checkBonus={checkBonus}
            damage={damage}
            destroyThreshold={destroyThreshold}
          />
        </InfoPopover>
      }
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
    </TrackerCard>
  );
}
