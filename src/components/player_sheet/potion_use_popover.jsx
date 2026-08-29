import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import BottomSheet from '../common/BottomSheet';
import Button from '../common/Button';
import Icon from '../common/Icon';
import Pill from '../common/Pill';
import { onUsePotion } from '../../store/thunks/playerSheetThunks';
import { dicePerLevelBonus, parseDiceExpr } from '../../lib/item/potionEffects';
import { rollDice } from '../../lib/dice';
import '../../style/potions.css';

/**
 * The box that opens when a potion's **use** button is pressed.
 *
 * It carries three things, in the order a player needs them: what the potion
 * does, the number it produced if it produced one, and the button that spends
 * it. Nothing happens until that button is pressed — opening the box is not
 * drinking.
 *
 * **The roll is offered, not imposed.** Ten of the 107 potions have a die in
 * them. The roll is made when the box opens, so a player who is not rolling
 * physical dice can simply press drink; and it stays editable, so a table that
 * *is* rolling types what it actually saw. The per-caster-level part is added
 * on top and is not editable, because it is not random — it is a property of
 * the bottle.
 *
 * **An oil is applied, not drunk.** It needs a target first, so the button stays
 * inert until one is chosen and the wording changes to match.
 */

/** How the target picker describes what it wants. */
const TARGET_PROMPT = {
  weapon: 'Apply to which weapon?',
  armor: 'Apply to which armor or shield?',
  ammo: 'Apply to which ammunition?',
  any: 'Apply to which item?',
};

const TARGET_EMPTY = {
  weapon: 'Nothing wielded — equip a weapon first.',
  armor: 'No armor or shield equipped.',
  ammo: 'No ammunition in the bag.',
  any: 'Nothing equipped.',
};

export default function PotionUsePopover({ potion, targets = [], damagedAbilities = [], onClose }) {
  const dispatch = useDispatch();
  const [rolled, setRolled] = useState('');
  const [target, setTarget] = useState('');

  const dice = potion?.dice || null;
  const parsed = useMemo(() => parseDiceExpr(dice?.expr), [dice]);
  const levelBonus = useMemo(
    () => dicePerLevelBonus(dice, potion?.casterLevel),
    [dice, potion]
  );

  /* Rolled once, when the box opens. Re-rolling on every render would move the
     number under the player's hand while they were reading it. */
  useEffect(() => {
    if (!parsed) { setRolled(''); return; }
    setRolled(String(rollDice(parsed.sides, parsed.count).total));
  }, [parsed]);

  /* Lesser restoration repairs one ability, so the picker offers the damaged
     ones rather than a list of equipment. */
  const repairing = Boolean(potion?.repairs);
  useEffect(() => {
    if (repairing) setTarget(damagedAbilities[0]?.ability || '');
  }, [repairing, damagedAbilities]);

  if (!potion) return null;

  const needsTarget = potion.kind === 'oil';
  const rollNumber = Number(rolled);
  const rollValid = !parsed || (Number.isFinite(rollNumber) && rollNumber >= 0);
  const total = parsed ? (Number.isFinite(rollNumber) ? rollNumber : 0) + levelBonus : 0;
  const blocked = (needsTarget && !target) || !rollValid;

  const verb = needsTarget ? 'Apply' : 'Drink';

  const confirm = () => {
    if (blocked) return;
    dispatch(onUsePotion(potion.name, {
      target: needsTarget || repairing ? target : '',
      roll: parsed ? total : null,
    }));
    onClose();
  };

  const targetList = repairing
    ? damagedAbilities.map((d) => ({ slot: d.ability, name: `${d.ability} −${d.amount}` }))
    : targets;

  return (
    <BottomSheet open onClose={onClose} title={potion.name} eyebrow={needsTarget ? 'Oil' : 'Potion'}>
      <div className="potion-use">
        <p className="potion-use-desc">{potion.description}</p>

        {potion.casterLevel > 0 && (
          <div className="potion-use-meta">
            <Pill tone="ghost">CL {potion.casterLevel}</Pill>
            {potion.grade > 0 && <Pill tone="ghost">+{potion.grade}</Pill>}
          </div>
        )}

        {/* The number, when there is one. Editable, because the dice on the
            table beat the dice in the app. */}
        {parsed && (
          <div className="potion-use-block">
            <span className="sh-eyebrow">
              {dice.into === 'tempHp' ? 'Temporary hit points' : repairing ? 'Points repaired' : 'Amount'}
            </span>
            <div className="potion-use-roll">
              <input
                type="number"
                className="sh-input potion-use-input"
                value={rolled}
                min={0}
                onChange={(e) => setRolled(e.target.value)}
                aria-label={`${dice.expr} roll`}
              />
              <span className="sh-faint potion-use-expr">
                {dice.expr}
                {levelBonus > 0 && ` + ${levelBonus}`}
              </span>
              {levelBonus > 0 && (
                <>
                  <Icon name="arrow_forward" size={16} className="sh-faint" />
                  <span className="potion-use-total">{total}</span>
                </>
              )}
            </div>
            {levelBonus > 0 && (
              <span className="sh-faint potion-use-hint">
                The +{levelBonus} is the potion’s caster level and is not rolled.
              </span>
            )}
          </div>
        )}

        {/* Oils, and lesser restoration, need to know what they are acting on. */}
        {(needsTarget || repairing) && (
          <div className="potion-use-block">
            <span className="sh-eyebrow">
              {repairing ? 'Repair which ability?' : TARGET_PROMPT[potion.target] || TARGET_PROMPT.any}
            </span>
            {targetList.length === 0 ? (
              <span className="sh-faint">
                {repairing ? 'No ability damage to repair.' : TARGET_EMPTY[potion.target] || TARGET_EMPTY.any}
              </span>
            ) : (
              <div className="potion-use-targets">
                {targetList.map((t) => (
                  <button
                    type="button"
                    key={t.slot}
                    className={['sh-chip', target === t.slot && 'is-on'].filter(Boolean).join(' ')}
                    onClick={() => setTarget(t.slot)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {potion.situational && (
          <div className="potion-use-note">
            <Icon name="info" size={16} />
            <span>{potion.situational}</span>
          </div>
        )}

        {/* Said plainly rather than hidden: a potion the sheet cannot model is
            still a potion, and the player should know what to expect before
            they spend it. */}
        {potion.kind === 'condition' && (
          <div className="potion-use-note">
            <Icon name="label" size={16} />
            <span>Nothing here maps onto a number the sheet keeps, so this becomes a pill you can see and clear.</span>
          </div>
        )}

        <div className="potion-use-actions">
          <Button variant="ghost" icon="close" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="local_bar" onClick={confirm} disabled={blocked}>
            {verb}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
