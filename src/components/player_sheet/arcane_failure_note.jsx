import { useSelector } from 'react-redux';
import Pill from '../common/Pill';
import InfoPopover from '../common/InfoPopover';
import '../../style/arcane_failure_note.css';

/**
 * The chance an arcane spell fails because of what the caster is wearing.
 *
 * classes.json carried `arcaneSpellFailureApplies` and the bard's
 * `noArcaneSpellFailureInLightArmor` from the start, and nothing read either:
 * a wizard in a chain shirt saw no number and no warning anywhere on the sheet.
 * The strip appears only when there is a chance to report, so a caster in robes
 * — and every divine caster — sees nothing.
 *
 * It sits above the spell table rather than inside it because the table is
 * shared with the Spellbook tab, which has no equipment to ask about.
 */
export default function ArcaneFailureNote() {
  const player = useSelector((state) => state.playerSheet?.player);
  const chance = player?.getArcaneSpellFailure?.() ?? 0;
  if (chance <= 0) return null;

  return (
    <div className="card card-width-spellbook arcane-failure-note">
      <Pill tone="warn" icon="warning">Arcane spell failure {chance}%</Pill>
      <InfoPopover label="Arcane spell failure">
        <p>
          Before casting an arcane spell with a <b>somatic</b> component, roll
          percentile dice. On <b>{chance} or less</b> the spell fails and the
          slot is spent anyway.
        </p>
        <p>
          Armor and shield chances add together, and being proficient does not
          reduce them — only taking the armor off does. A spell with no somatic
          component ignores this entirely, as do divine spells.
        </p>
      </InfoPopover>
    </div>
  );
}
