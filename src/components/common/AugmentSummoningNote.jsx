import { useSelector } from 'react-redux';
import Icon from './Icon';
import {
  AUGMENT_SUMMONING_BONUS,
  AUGMENT_SUMMONING_ABILITY_NAMES,
  AUGMENT_SUMMONING_ABILITIES,
} from '../../lib/player/augmentSummoning';
import '../../style/augment_summoning_note.css';

/**
 * A reminder, on a creature's stat block, that a summoned one is stronger than
 * the block says.
 *
 * Augment Summoning raises what a spell *brings*, so a bestiary entry has no
 * honest way to apply it: nothing in the app links a monster being read to the
 * spell that might have conjured it, and a creature met in a cave was not
 * summoned at all. So the printed scores are left exactly as they are and this
 * says the arithmetic instead — deliberately conditional ("if you summoned
 * this"), because the app cannot know that it was.
 *
 * It appears only when the selected character actually has the feat, which is
 * the one thing the app *does* know, so nobody else ever sees it.
 *
 * Coloured as a raised value rather than as a warning: `--accent` would read as
 * an alarm to anyone running a red theme, which a bonus is not.
 */
export default function AugmentSummoningNote() {
  const player = useSelector((state) => state.playerSheet?.player);
  if (!player?.hasAugmentSummoning?.()) return null;

  const scores = AUGMENT_SUMMONING_ABILITIES
    .map((key) => AUGMENT_SUMMONING_ABILITY_NAMES[key] ?? key)
    .join(' and ');

  return (
    <div className="augment-summoning-note">
      <Icon name="auto_awesome" size={16} />
      <span>
        If you summoned this creature, <b>Augment summoning</b> gives it{' '}
        <b>+{AUGMENT_SUMMONING_BONUS} {scores}</b> for the spell&rsquo;s duration
        — the scores below are the unsummoned ones.
      </span>
    </div>
  );
}
