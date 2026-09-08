import { useDispatch, useSelector } from 'react-redux';
import IconButton from '../common/IconButton';
import InfoPopover from '../common/InfoPopover';
import Icon from '../common/Icon';
import Pill from '../common/Pill';
import { onSetPowerAttack, onSetCombatExpertise } from '../../store/thunks/playerSheetThunks';
import '../../style/combat_stances.css';
import { t, tx, tName } from '../../lib/i18n';

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
          title={tx('Less {0}', name)}
          aria-label={tx('Less {0}', name)}
          onClick={() => onChange(value - 1)}
        />
        <span
          className={`combat-stance-value${overCap ? ' is-over' : ''}`}
          aria-label={tx('{0} {1}', name, value)}
        >
          {value}
        </span>
        <IconButton
          icon="add"
          ghost
          size="sm"
          title={tx('More {0}', name)}
          aria-label={tx('More {0}', name)}
          onClick={() => onChange(value + 1)}
        />
      </span>

      {overCap && (
        <div className="sh-warn-strip combat-stance-over">
          <Icon name="warning" />
          {tx('{0} over your base attack bonus of {1}', value - max, max)}
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
          name={tName('feats', 'Power attack')}
          value={power}
          max={player.getPowerAttackMax?.() ?? 0}
          overCap={player.isPowerAttackOverCap?.() ?? false}
          onChange={(n) => dispatch(onSetPowerAttack(n))}
          summary={power > 0 && (
            <Pill tone="warn">{tx('−{0} to hit', power)}</Pill>
          )}
        >
          <p>
            {tx(
              'Trade up to your {0} — {1} — from every melee attack roll this round, and add the same to melee damage. There is no cap of 5; that belongs to {2}.',
              <b>{t('base attack bonus')}</b>,
              player.getPowerAttackMax?.() ?? 0,
              tName('feats', 'Combat expertise')
            )}
          </p>
          <p>
            {tx(
              'A {0} weapon, or a one-handed one held in both hands, adds {1} the number to damage while the attack penalty stays the same.',
              <b>{t('two-handed')}</b>,
              <b>{t('twice')}</b>
            )}
          </p>
          <p>
            {tx(
              'A {0} weapon gains no damage at all and still takes the full penalty — an unarmed strike or a natural weapon is the exception and does get it. Ranged attacks are untouched either way.',
              <b>{t('light')}</b>
            )}
          </p>
        </StanceRow>
      )}

      {hasExpertise && (
        <StanceRow
          name={tName('feats', 'Combat expertise')}
          value={expertise}
          max={player.getCombatExpertiseMax?.() ?? 0}
          overCap={player.isCombatExpertiseOverCap?.() ?? false}
          onChange={(n) => dispatch(onSetCombatExpertise(n))}
          summary={expertise > 0 && (
            <>
              <Pill tone="warn">{tx('−{0} to hit', expertise)}</Pill>
              <Pill tone="success">{tx('+{0} AC', expertise)}</Pill>
            </>
          )}
        >
          <p>
            {tx(
              'Trade up to {0} from your melee attack rolls for the same as a {1} to Armor Class, until your next action. Your base attack bonus caps it lower than 5 until you reach 5th level — yours allows {2}.',
              <b>5</b>,
              <b>{t('dodge bonus')}</b>,
              player.getCombatExpertiseMax?.() ?? 0
            )}
          </p>
          <p>
            {tx(
              'A dodge bonus counts against {0} but is lost the moment you are {1} or otherwise denied your Dexterity.',
              <b>{t('touch attacks')}</b>,
              <b>{t('flat-footed')}</b>
            )}
          </p>
          <p>
            {t('Usable only on the attack or full-attack action, and only in melee.')}
          </p>
        </StanceRow>
      )}
    </div>
  );
}
