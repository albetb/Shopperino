import { useDispatch, useSelector } from 'react-redux';
import { t, tx } from '../../lib/i18n';
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
        {tx(
          'A standard action that does not provoke an attack of opportunity. Brandish your holy symbol and it affects undead within {0}, in line of sight and line of effect.',
          <b>{t('60 ft')}</b>,
        )}
      </p>
      <p><b>{t('It takes two rolls, in this order:')}</b></p>
      <ul>
        <li>
          <b>{tx('The {0} check', t(verbing))}</b> — {tx(
            'd20 {0} decides {1} an undead you can touch. Look the result up on the turning table: it gives the highest Hit Dice affected, from your {2} level {3} to {4}.',
            fmt(checkBonus),
            <i>{t('how powerful')}</i>,
            t(verbing),
            fmt(-4),
            fmt(4),
          )}
        </li>
        <li>
          <b>{rebukes ? t('Rebuking damage') : t('Turning damage')}</b> — {tx(
            '{0} is {1} Hit Dice of undead you affect in total, spending it on the closest and weakest first. You may skip a stronger one nearby, and any remainder too small for the next undead is wasted.',
            damage.formula,
            <i>{t('how many')}</i>,
          )}
        </li>
      </ul>
      {rebukes ? (
        <p>
          {tx(
            'Rebuked undead cower for {0}, and attacks against them get +2. Any with {1} can be {2} instead — a standard action per order, holding at most {3} HD of undead at a time.',
            <b>{t('10 rounds')}</b>,
            <b>{tx('{0} HD or less', destroyThreshold)}</b>,
            <b>{t('commanded')}</b>,
            effectiveLevel,
          )}
        </p>
      ) : (
        <p>
          {tx(
            'Turned undead flee at full speed for {0}, and cower if cornered. Any with {1} — half your turning level — are {2} outright instead.',
            <b>{t('10 rounds')}</b>,
            <b>{tx('{0} HD or less', destroyThreshold)}</b>,
            <b>{t('destroyed')}</b>,
          )}
        </p>
      )}
      <p>
        {tx(
          'Coming within 10 ft of a {0} undead, or attacking it in melee, breaks the effect on that creature. Ranged attacks from further off do not.',
          t(rebukes ? 'rebuked' : 'turned'),
        )}
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
      title={tx('{0} undead', t(verb))}
      eyebrow={tx('Turning level {0}', effectiveLevel)}
      collapseKey="turnUndead"
      used={player.getClassFeatureUsed('turnUndead')}
      max={player.getTurnUndeadAttemptsMax()}
      onUse={(delta) => dispatch(onUseClassFeature('turnUndead', delta))}
      onReset={() => dispatch(onResetClassFeature('turnUndead'))}
      action={
        <InfoPopover label={tx('{0} undead', t(verb))}>
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
          {tx('Check d20 {0}', fmt(checkBonus))}
        </Pill>
        <Pill tone="accent">{tx('{0} HD affected', damage.formula)}</Pill>
      </div>

      <div className="tracker-card-row tracker-card-meta">
        <Pill tone="ghost">
          {tx('Highest HD: turning level {0} to {1} by check result', fmt(-4), fmt(4))}
        </Pill>
        <Pill tone={destroyThreshold > 0 ? 'danger' : 'ghost'} icon="skull">
          {tx('{0} {1} HD or less', t(rebukes ? 'Commands' : 'Destroys'), destroyThreshold)}
        </Pill>
      </div>
    </TrackerCard>
  );
}
