import PropTypes from 'prop-types';
import { signed } from '../../lib/utils';

/**
 * A number and the lines that make it up, shown open rather than behind an
 * info button.
 *
 * On the character sheet a breakdown is reference — you look at it once and
 * then trust the total. Here it is the point of the page: a master who can see
 * that the trap is CR 5 because the damage is worth +3 and the Disable DC +1
 * knows which knob to turn. So it sits on the page, and the rows always sum to
 * the total printed under them.
 */
export default function TrapBreakdown({ title, total, unit = '', rows, note = '' }) {
  return (
    <div className="trap-breakdown">
      <div className="trap-breakdown-head">
        <span className="trap-breakdown-title">{title}</span>
        <span className="trap-breakdown-total">{total}{unit && ` ${unit}`}</span>
      </div>
      <ul className="trap-breakdown-rows">
        {rows.map((row) => (
          <li className="trap-breakdown-row" key={row.key}>
            <span className="trap-breakdown-label">{row.label}</span>
            <span className={'trap-breakdown-value' + (row.value < 0 ? ' is-down' : '')}>
              {row.display ?? signed(row.value)}
            </span>
          </li>
        ))}
      </ul>
      {note && <p className="trap-breakdown-note">{note}</p>}
    </div>
  );
}

TrapBreakdown.propTypes = {
  title: PropTypes.string.isRequired,
  total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string,
  rows: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.number,
    display: PropTypes.string,
  })).isRequired,
  note: PropTypes.string,
};
