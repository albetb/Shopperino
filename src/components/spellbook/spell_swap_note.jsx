import { useState } from 'react';
import PropTypes from 'prop-types';
import { t, tx, tName } from '../../lib/i18n';
import Stepper from '../common/Stepper';
import '../../style/spell_swap_note.css';

/**
 * The levels at which a spontaneous caster may trade one known spell for
 * another — the sorcerer's 4th and every even level after, the bard's 5th and
 * every third — and how many of those trades have been spent.
 *
 * Learning and unlearning stay free actions here: gating them on a swap would
 * only get in the way at the table. The counter is a tally the player keeps,
 * not a lock, and per the non-enforcing rule in CLAUDE.md it accepts a count
 * past what the level earned and flags it rather than refusing.
 *
 * Collapsed by default, like the class and domain description cards it sits
 * with: the levels are a reference read once, while the count is the part
 * worth having on the head.
 */
export default function SpellSwapNote({ inst, onSetSwapsUsed }) {
  const [collapsed, setCollapsed] = useState(true);
  const levels = inst?.getSpellSwapLevels?.() ?? [];
  if (levels.length === 0) return null;

  const current = Number(inst?.Level) || 0;
  const earned = inst?.getSpellSwapsEarned?.() ?? levels.filter((lvl) => current >= lvl).length;
  const used = inst?.getSpellSwapsUsed?.() ?? 0;
  const next = levels.find((lvl) => lvl > current);
  const overCap = used > earned;

  return (
    <div className={`card card-width-spellbook spell-swap-note ${collapsed ? 'collapsed' : ''}`}>
      <div
        className="card-side-div card-expand-div spell-swap-note-head"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="material-symbols-outlined">swap_horiz</span>
        <h3 className="card-title">{t('Spell swaps')}</h3>
        <span className={overCap ? 'spell-swap-count is-over' : 'spell-swap-count'}>
          {used} / {earned}
        </span>
        <button type="button" className="collapse-button" aria-label={t('Toggle spell swaps')}>
          <span className="material-symbols-outlined">
            {collapsed ? 'expand_more' : 'expand_less'}
          </span>
        </button>
      </div>

      {!collapsed && (
        <div className="card-content spell-swap-note-content">
          <div className="spell-swap-counter">
            <span className="sh-eyebrow">{t('Swaps used')}</span>
            <Stepper
              value={used}
              min={0}
              max={99}
              onChange={(v) => onSetSwapsUsed?.(v)}
            />
          </div>

          {overCap && (
            <div className="sh-warn-strip">
              {tx('{0} more than this level has earned.', used - earned)}
            </div>
          )}

          <p className="spell-swap-note-body">
            {tx(
              'A {0} may trade one known spell for another of the same level on reaching level {1}. {2} The new spell must be of a level you can already cast. Learning here is not restricted — keep the tally above.',
              tName('classes', inst.Class),
              <>
                {levels.map((lvl, i) => (
                  <span key={lvl} className={lvl <= current ? 'swap-level is-reached' : 'swap-level'}>
                    {lvl}{i < levels.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </>,
              next ? tx('Next at level {0}.', next) : t('All of them are behind you.'),
            )}
          </p>
        </div>
      )}
    </div>
  );
}

SpellSwapNote.propTypes = {
  inst: PropTypes.object,
  onSetSwapsUsed: PropTypes.func,
};
