import PropTypes from 'prop-types';
import { tx } from '../../lib/i18n';
import { isMobile, trimLine } from '../../lib/utils';

export default function SpellbookTableHeader({ spellbook, page }) {
  if (!spellbook?.Name || !spellbook?.Class) return null;

  /* A whole sentence with the character's name in it, so the name is a hole in
     a template rather than a piece glued to a fixed English tail: Italian puts
     the verb somewhere else. */
  const who = trimLine(spellbook.Name, isMobile() ? 20 : 30);
  let headerText;
  switch (page) {
    case 1:
      headerText = tx('{0} is preparing spells', who);
      break;
    case 2:
      headerText = tx('Spellbook of {0}', who);
      break;
    default:
      headerText = tx('{0} is learning spells', who);
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
