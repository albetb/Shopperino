import PropTypes from 'prop-types';
import '../../style/spell_swap_note.css';

/**
 * The levels at which a spontaneous caster may trade one known spell for
 * another — the sorcerer's 4th and every even level after, the bard's 5th and
 * every third.
 *
 * Informational only. Learning and unlearning are already free actions here,
 * so gating them on a swap would only get in the way at the table; the note
 * says which levels the rules allow it and marks the ones already reached.
 */
export default function SpellSwapNote({ inst }) {
  const levels = inst?.getSpellSwapLevels?.() ?? [];
  if (levels.length === 0) return null;

  const current = Number(inst?.Level) || 0;
  const reached = levels.filter(lvl => lvl <= current);
  const next = levels.find(lvl => lvl > current);

  return (
    <div className="card card-width-spellbook spell-swap-note">
      <div className="spell-swap-note-head">
        <span className="material-symbols-outlined">swap_horiz</span>
        <span>
          {reached.length > 0
            ? `${reached.length} spell swap${reached.length === 1 ? '' : 's'} earned so far`
            : 'No spell swap earned yet'}
        </span>
      </div>
      <p className="spell-swap-note-body">
        A {inst.Class} may trade one known spell for another of the same level
        on reaching level{' '}
        {levels.map((lvl, i) => (
          <span key={lvl} className={lvl <= current ? 'swap-level is-reached' : 'swap-level'}>
            {lvl}{i < levels.length - 1 ? ', ' : ''}
          </span>
        ))}
        . {next ? `Next at level ${next}.` : 'All of them are behind you.'} The new
        spell must be of a level you can already cast. Learning here is not
        restricted — track the swaps at the table.
      </p>
    </div>
  );
}

SpellSwapNote.propTypes = {
  inst: PropTypes.object,
};
