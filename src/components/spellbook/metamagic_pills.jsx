import PropTypes from 'prop-types';
import { t, tx } from '../../lib/i18n';
import { metamagicLabels } from '../../lib/spellbook/metamagic';

const HEIGHTENED_TO = /^Heightened to (\d+)$/;

/** metamagicLabels() returns fixed adjectives, or "Heightened to {n}" — the
    only one carrying a value, so it needs its own translated template. */
function translateLabel(label) {
  const m = HEIGHTENED_TO.exec(label);
  return m ? tx('Heightened to {0}', m[1]) : t(label);
}

/**
 * What has been done to a preparation, said beside the spell's name.
 *
 * Pills rather than a "(maximized, silent)" suffix, because two or three of
 * them stack legibly and a parenthesised list does not — and because the same
 * spell now appears in two different level cards, so the row has to say which
 * of the two it is at a glance.
 */
export default function MetamagicPills({ mm, className = '' }) {
  const labels = metamagicLabels(mm);
  if (!labels.length) return null;
  return (
    <span className={['mm-pills', className].filter(Boolean).join(' ')}>
      {labels.map((label) => (
        <span className="mm-pill" key={label}>{translateLabel(label)}</span>
      ))}
    </span>
  );
}

MetamagicPills.propTypes = {
  mm: PropTypes.number,
  className: PropTypes.string,
};
