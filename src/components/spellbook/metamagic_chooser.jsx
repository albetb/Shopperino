import PropTypes from 'prop-types';
import { t, tx } from '../../lib/i18n';
import {
  HEIGHTEN,
  MAX_HEIGHTEN_LEVEL,
  decodeMetamagic,
  toggleMetamagic,
  encodeMetamagic,
  getSlotAdjustment,
  metamagicLabel,
  modifiedSpellLevel,
  effectiveSpellLevel,
  isImpossibleSlot,
} from '../../lib/spellbook/metamagic';

/**
 * Build one combination of metamagic, and say what it costs.
 *
 * Shared by both popovers, because choosing the feats is the same act whether
 * a wizard is doing it at dawn or a sorcerer at the table — only what happens
 * afterwards differs.
 *
 * The two numbers under the chips are deliberately two numbers. Every metamagic
 * feat but one moves the **slot** and leaves the spell working at its own
 * level; Heighten moves both, which is why it gets a target picker instead of
 * an on/off chip and why the save DC line appears only for it.
 *
 * @param {string[]} available - Feat names to offer.
 * @param {number} baseLevel - The spell's level on this class's list.
 * @param {number} mm - The combination being built.
 * @param {(mm: number) => void} onChange
 * @param {string} [warnFeat] - A feat to flag rather than hide, with `warning`.
 */
export default function MetamagicChooser({
  available,
  baseLevel,
  mm,
  onChange,
  warnFeat = '',
  warning = '',
}) {
  const { feats, heightenTo } = decodeMetamagic(mm);
  const slot = modifiedSpellLevel(baseLevel, mm);
  const effective = effectiveSpellLevel(baseLevel, mm);
  const impossible = isImpossibleSlot(baseLevel, mm);
  const offersHeighten = available.includes(HEIGHTEN);
  const fixed = available.filter((name) => name !== HEIGHTEN);
  const flagged = warnFeat && feats.includes(warnFeat);

  return (
    <div className="mm-chooser">
      <div className="mm-chip-row">
        {fixed.map((name) => {
          const on = feats.includes(name);
          const adjustment = getSlotAdjustment(name);
          return (
            <button
              type="button"
              key={name}
              className={['sh-chip', 'mm-chip', on && 'is-on', on && name === warnFeat && 'is-warned']
                .filter(Boolean).join(' ')}
              aria-pressed={on}
              onClick={() => onChange(toggleMetamagic(mm, name, !on))}
            >
              {t(metamagicLabel(name))}
              <span className="mm-chip-cost">+{adjustment}</span>
            </button>
          );
        })}
      </div>

      {offersHeighten && (
        <div className="mm-heighten">
          <span className="mm-heighten-label">{t('Heighten to')}</span>
          <div className="mm-chip-row">
            {Array.from({ length: MAX_HEIGHTEN_LEVEL }, (_, i) => i + 1).map((level) => {
              const on = heightenTo === level;
              return (
                <button
                  type="button"
                  key={level}
                  className={['sh-chip', 'mm-chip', 'mm-chip-level', on && 'is-on']
                    .filter(Boolean).join(' ')}
                  aria-pressed={on}
                  aria-label={tx('Heighten to level {0}', level)}
                  onClick={() => {
                    const others = feats.filter((f) => f !== HEIGHTEN);
                    onChange(on ? encodeMetamagic(others) : encodeMetamagic([...others, HEIGHTEN], level));
                  }}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mm-summary">
        <div className={'mm-summary-line' + (impossible ? ' is-over' : '')}>
          {tx('Occupies a {0} slot', <b>{tx('level {0}', slot)}</b>)}
        </div>
        {impossible && (
          <div className="mm-summary-note is-over">
            {tx('No caster has a level {0} slot — the highest there is is 9.', slot)}
          </div>
        )}
        {effective !== baseLevel ? (
          <div className="mm-summary-note">
            {tx(
              "Heighten raises the spell's own level too, so its save DC and everything else that reads the level follow {0}.",
              <b>{tx('level {0}', effective)}</b>,
            )}
          </div>
        ) : (
          feats.length > 0 && (
            <div className="mm-summary-note">
              {tx(
                'The spell still works as a {0} spell — only the slot moves.',
                <b>{tx('level {0}', baseLevel)}</b>,
              )}
            </div>
          )
        )}
        {flagged && <div className="mm-summary-note is-over">{warning}</div>}
      </div>
    </div>
  );
}

MetamagicChooser.propTypes = {
  available: PropTypes.arrayOf(PropTypes.string).isRequired,
  baseLevel: PropTypes.number.isRequired,
  mm: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  warnFeat: PropTypes.string,
  warning: PropTypes.string,
};
