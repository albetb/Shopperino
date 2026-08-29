import PropTypes from 'prop-types';
import { metamagicLabels } from '../../lib/spellbook/metamagic';

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
        <span className="mm-pill" key={label}>{label}</span>
      ))}
    </span>
  );
}

MetamagicPills.propTypes = {
  mm: PropTypes.number,
  className: PropTypes.string,
};
