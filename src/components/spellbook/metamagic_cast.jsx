import { useState } from 'react';
import PropTypes from 'prop-types';
import { t, tx } from '../../lib/i18n';
import AnchorPopover from '../common/AnchorPopover';
import MetamagicChooser from './metamagic_chooser';
import { metamagicLabel, modifiedSpellLevel } from '../../lib/spellbook/metamagic';
import { spellName } from '../../lib/i18n/spellText';

const QUICKEN = 'Quicken spell';
const QUICKEN_WARNING_EN = 'A spontaneously cast spell cannot be quickened — applying '
  + 'any metamagic to one already costs a full-round action.';

/**
 * Cast a spell with metamagic, at the table.
 *
 * Two different reasons to open the same box:
 *
 * - **A sorcerer or bard chooses here and only here.** Their list is of spells
 *   *known*, so there is no preparation to attach a choice to ahead of time —
 *   the choice is part of casting, and it spends a slot of the modified level.
 * - **Anyone holding a metamagic rod.** A rod applies its feat *without*
 *   raising the slot, which is the entire reason to own one, so it is a second
 *   way to cast the spell that is already prepared rather than a second
 *   preparation. It costs one of the rod's three charges for the day.
 */
export default function MetamagicCastButton({
  spell,
  baseLevel,
  spontaneous,
  available,
  rods,
  remainingFor,
  onCast,
  onCastWithRod,
  blocked = false,
}) {
  const [mm, setMm] = useState(0);
  const level = modifiedSpellLevel(baseLevel, mm);
  const remaining = remainingFor(mm);

  return (
    <AnchorPopover
      label={tx('Metamagic — {0}', spellName(spell.Name))}
      className="mm-popover"
      width="24rem"
      renderTrigger={({ ref, open, toggle }) => (
        <button
          type="button"
          ref={ref}
          className="mm-trigger"
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          aria-expanded={open}
          aria-label={tx('Cast {0} with metamagic', spellName(spell.Name))}
          title={tx('Cast {0} with metamagic', spellName(spell.Name))}
        >
          <span className="material-symbols-outlined">auto_fix_high</span>
        </button>
      )}
    >
      {spontaneous && available.length > 0 && (
        <>
          <MetamagicChooser
            available={available}
            baseLevel={baseLevel}
            mm={mm}
            onChange={setMm}
            warnFeat={QUICKEN}
            warning={t(QUICKEN_WARNING_EN)}
          />
          <div className="mm-cast-row">
            <span className="mm-cast-remaining">
              {remaining === 1
                ? tx('{0} level {1} slot left', remaining, level)
                : tx('{0} level {1} slots left', remaining, level)}
            </span>
            <button
              type="button"
              className="modern-button mm-cast-button"
              disabled={mm === 0 || blocked}
              onClick={() => onCast(mm)}
            >
              <b>{t('Cast')}</b>
            </button>
          </div>
          {mm !== 0 && remaining <= 0 && (
            <p className="mm-hint is-over">
              {tx('No level {0} slot left today. Casting anyway is allowed and takes the count below zero.', level)}
            </p>
          )}
        </>
      )}

      {rods.length > 0 && (
        <div className="mm-rods">
          <div className="mm-rods-title">{t('Metamagic rods in hand')}</div>
          <p className="mm-hint">
            {t('A rod applies its feat without raising the slot — the spell is cast out of the slot it is already in, and the rod spends a charge.')}
          </p>
          {rods.map((rod) => {
            const overLevel = rod.maxLevel > 0 && baseLevel > rod.maxLevel;
            const spent = rod.remaining <= 0;
            return (
              <div className="mm-rod" key={rod.id}>
                <div className="mm-rod-head">
                  <span className="mm-rod-name">{rod.name}</span>
                  <span className="mm-rod-charges">{rod.remaining}/{rod.maxCharges}</span>
                </div>
                <div className="mm-rod-body">
                  <span className="mm-rod-feat">{t(metamagicLabel(rod.feat))}</span>
                  <button
                    type="button"
                    className="modern-button mm-cast-button"
                    disabled={blocked}
                    onClick={() => onCastWithRod(rod.id)}
                  >
                    <b>{t('Cast')}</b>
                  </button>
                </div>
                {overLevel && (
                  <div className="mm-summary-note is-over">
                    {tx('This rod reaches spells of level {0} and below; this one is level {1}.', rod.maxLevel, baseLevel)}
                  </div>
                )}
                {spent && (
                  <div className="mm-summary-note is-over">
                    {tx("All {0} of today's charges are spent.", rod.maxCharges)}
                  </div>
                )}
                {rod.isSecondarySet && (
                  <div className="mm-summary-note">
                    {t('In your other hand set — you would have to swap to it first.')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AnchorPopover>
  );
}

MetamagicCastButton.propTypes = {
  spell: PropTypes.shape({ Name: PropTypes.string, Link: PropTypes.string }).isRequired,
  baseLevel: PropTypes.number.isRequired,
  spontaneous: PropTypes.bool.isRequired,
  available: PropTypes.arrayOf(PropTypes.string).isRequired,
  rods: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    feat: PropTypes.string,
    maxLevel: PropTypes.number,
    remaining: PropTypes.number,
    maxCharges: PropTypes.number,
    isSecondarySet: PropTypes.bool,
  })).isRequired,
  remainingFor: PropTypes.func.isRequired,
  onCast: PropTypes.func.isRequired,
  onCastWithRod: PropTypes.func.isRequired,
  blocked: PropTypes.bool,
};
