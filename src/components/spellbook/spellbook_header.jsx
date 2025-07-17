import PropTypes from 'prop-types';
import { isMobile, trimLine } from '../../lib/utils';

export default function SpellbookTableHeader({ spellbook, page }) {
  if (!spellbook?.Name || !spellbook?.Class) return null;

  let headerText;
  switch (page) {
    case 1:
      headerText = `${trimLine(spellbook.Name, isMobile() ? 20 : 30)} is preparing spells`;
      break;
    case 2:
      headerText = `Spellbook of ${trimLine(spellbook.Name, isMobile() ? 20 : 30)}`;
      break;
    default:
      headerText = `${trimLine(spellbook.Name, isMobile() ? 20 : 30)} is learning spells`;
  }

  return (
    <div className="header-container">
      <h4>{headerText}</h4>
    </div>
  );
}

SpellbookTableHeader.propTypes = {
  spellbook: PropTypes.shape({
    Name: PropTypes.string.isRequired,
    Class: PropTypes.string.isRequired,
  }).isRequired,
  page: PropTypes.number.isRequired,
};
