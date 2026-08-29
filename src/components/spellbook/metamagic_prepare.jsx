import { useState } from 'react';
import PropTypes from 'prop-types';
import AnchorPopover from '../common/AnchorPopover';
import MetamagicChooser from './metamagic_chooser';
import MetamagicPills from './metamagic_pills';
import { FusedStepper } from './row_actions';

/**
 * Attach metamagic to a preparation, at the moment of preparing it.
 *
 * A prepared caster commits at dawn: the slot is chosen when the spell is
 * prepared, and from then on it *is* a 3rd-level preparation. So the control
 * belongs on the prepare page, beside the ordinary count, and what it produces
 * is a second preparation of the same spell rather than a change to the first.
 *
 * The stepper below the chips is the point of the popover: it says how many of
 * this spell's prepared copies carry this combination, so preparing four magic
 * missile and maximizing two of them is one interaction, not four.
 */
export default function MetamagicPrepareButton({
  spell,
  baseLevel,
  available,
  preparations,
  preparedFor,
  onPrepare,
  onUnprepare,
}) {
  const [mm, setMm] = useState(0);
  const count = preparedFor(mm);
  const others = preparations.filter((p) => p.mm !== mm);

  return (
    <AnchorPopover
      label={`Metamagic — ${spell.Name}`}
      className="mm-popover"
      width="24rem"
      renderTrigger={({ ref, open, toggle }) => (
        <button
          type="button"
          ref={ref}
          className={'mm-trigger' + (preparations.length ? ' has-any' : '')}
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          aria-expanded={open}
          aria-label={`Prepare ${spell.Name} with metamagic`}
          title={`Prepare ${spell.Name} with metamagic`}
        >
          <span className="material-symbols-outlined">auto_fix_high</span>
        </button>
      )}
    >
      <MetamagicChooser
        available={available}
        baseLevel={baseLevel}
        mm={mm}
        onChange={setMm}
      />

      {mm === 0 ? (
        <p className="mm-hint">
          Pick a feat above to prepare a modified copy of this spell. It becomes
          a preparation of its own, alongside the ordinary one.
        </p>
      ) : (
        <div className="mm-prepare-row">
          <MetamagicPills mm={mm} />
          <FusedStepper
            value={count}
            onChange={(next) => (next > count ? onPrepare(mm) : onUnprepare(mm))}
          />
        </div>
      )}

      {others.length > 0 && (
        <div className="mm-other-preps">
          <div className="mm-other-preps-title">Also prepared</div>
          {others.map((p) => (
            <button
              type="button"
              key={p.mm}
              className="mm-other-prep"
              onClick={() => setMm(p.mm)}
              title="Edit this preparation"
            >
              <MetamagicPills mm={p.mm} />
              <span className="mm-other-prep-count">
                {p.Prepared}× at level {p.level}
              </span>
            </button>
          ))}
        </div>
      )}
    </AnchorPopover>
  );
}

MetamagicPrepareButton.propTypes = {
  spell: PropTypes.shape({ Name: PropTypes.string, Link: PropTypes.string }).isRequired,
  baseLevel: PropTypes.number.isRequired,
  available: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Every metamagic'd preparation of this spell that already exists. */
  preparations: PropTypes.arrayOf(PropTypes.shape({
    mm: PropTypes.number,
    Prepared: PropTypes.number,
    level: PropTypes.number,
  })).isRequired,
  /** How many copies carry one combination. */
  preparedFor: PropTypes.func.isRequired,
  onPrepare: PropTypes.func.isRequired,
  onUnprepare: PropTypes.func.isRequired,
};
