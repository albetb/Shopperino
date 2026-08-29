import { useDispatch, useSelector } from 'react-redux';
import IconButton from '../common/IconButton';
import InfoPopover from '../common/InfoPopover';
import Icon from '../common/Icon';
import Pill from '../common/Pill';
import { onSetPowerAttack, onSetCombatExpertise } from '../../store/thunks/playerSheetThunks';
import '../../style/combat_stances.css';

/**
 * Power Attack and Combat Expertise, at the foot of the attacks card.
 *
 * Every other number on this card is one the sheet works out. These two are
 * not: each is a number the player *declares* at the start of a round, trading
 * attack bonus for damage or for armor class. So they need a control rather
 * than a display — and once declared they are ordinary contributions, which is
 * why the attack and damage above move as the stepper does. What the card
 * shows is what is actually being rolled.
 *
 * Only the feats the character holds appear; a character with neither gets
 * nothing at all. Per the non-enforcing rule, the stepper goes past the legal
 * cap and says so rather than stopping.
 *
 * Rules: dnd-rules/feats.md, and combat.md for what a dodge bonus applies to.
 */

function StanceRow({ name, value, max, overCap, onChange, summary, children }) {
  return (
    <div className="combat-stance-row">
      <span className="combat-stance-label">
        <span className="sh-display">{name}</span>
        <InfoPopover label={name}>{children}</InfoPopover>
      </span>

      <span className="combat-stance-controls">
        {summary}
        <IconButton
          icon="remove"
          ghost
          size="sm"
          disabled={value <= 0}
          title={`Less ${name}`}
          aria-label={`Less ${name}`}
          onClick={() => onChange(value - 1)}
        />
        <span
          className={`combat-stance-value${overCap ? ' is-over' : ''}`}
          aria-label={`${name} ${value}`}
        >
          {value}
        </span>
        <IconButton
          icon="add"
          ghost
          size="sm"
          title={`More ${name}`}
          aria-label={`More ${name}`}
          onClick={() => onChange(value + 1)}
        />
      </span>

      {overCap && (
        <div className="sh-warn-strip combat-stance-over">
          <Icon name="warning" />
          {value - max} over your base attack bonus of {max}
        </div>
      )}
    </div>
  );
}

export default function CombatStancesRow() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet.player);
  if (!player) return null;

  const hasPowerAttack = player.hasFeatNamed?.('Power attack') ?? false;
  const hasExpertise = player.hasFeatNamed?.('Combat expertise') ?? false;
  if (!hasPowerAttack && !hasExpertise) return null;

  const power = player.getPowerAttack?.() ?? 0;
  const expertise = player.getCombatExpertise?.() ?? 0;

  return (
    <div className="combat-stances">
      {hasPowerAttack && (
        <StanceRow
          name="Power attack"
          value={power}
          max={player.getPowerAttackMax?.() ?? 0}
          overCap={player.isPowerAttackOverCap?.() ?? false}
          onChange={(n) => dispatch(onSetPowerAttack(n))}
          summary={power > 0 && (
            <Pill tone="warn">−{power} to hit</Pill>
          )}
        >
          <p>
            Trade up to your <b>base attack bonus</b> — {player.getPowerAttackMax?.() ?? 0} — from
            every melee attack roll this round, and add the same to melee damage.
            There is no cap of 5; that belongs to Combat expertise.
          </p>
          <p>
            A <b>two-handed</b> weapon, or a one-handed one held in both hands,
            adds <b>twice</b> the number to damage while the attack penalty stays
            the same.
          </p>
          <p>
            A <b>light</b> weapon gains no damage at all and still takes the full
            penalty — an unarmed strike or a natural weapon is the exception and
            does get it. Ranged attacks are untouched either way.
          </p>
        </StanceRow>
      )}

      {hasExpertise && (
        <StanceRow
          name="Combat expertise"
          value={expertise}
          max={player.getCombatExpertiseMax?.() ?? 0}
          overCap={player.isCombatExpertiseOverCap?.() ?? false}
          onChange={(n) => dispatch(onSetCombatExpertise(n))}
          summary={expertise > 0 && (
            <>
              <Pill tone="warn">−{expertise} to hit</Pill>
              <Pill tone="success">+{expertise} AC</Pill>
            </>
          )}
        >
          <p>
            Trade up to <b>5</b> from your melee attack rolls for the same as a{' '}
            <b>dodge bonus</b> to Armor Class, until your next action. Your base
            attack bonus caps it lower than 5 until you reach 5th level —
            yours allows {player.getCombatExpertiseMax?.() ?? 0}.
          </p>
          <p>
            A dodge bonus counts against <b>touch attacks</b> but is lost the
            moment you are <b>flat-footed</b> or otherwise denied your Dexterity.
          </p>
          <p>
            Usable only on the attack or full-attack action, and only in melee.
          </p>
        </StanceRow>
      )}
    </div>
  );
}
