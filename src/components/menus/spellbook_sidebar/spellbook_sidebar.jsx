import { useDispatch, useSelector } from 'react-redux';
import { setIsSpellbookSidebarCollapsed } from '../../../store/slices/spellbookSlice';
import SpellbookMenuCards from './cards/spellbook_menu_cards';
import '../../../style/sidebar.css';

export default function SpellbookSidebar() {
  const dispatch = useDispatch();
  const isCollapsed = useSelector(state => state.spellbook.isSpellbookSidebarCollapsed);

  const handleToggle = () => {
    dispatch(setIsSpellbookSidebarCollapsed(!isCollapsed));
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-button" onClick={handleToggle}>
        <span className="material-symbols-outlined">
          {isCollapsed ? 'menu_open' : 'arrow_back_ios'}
        </span>
      </button>
      {!isCollapsed && <SpellbookMenuCards />}
    </div>
  );
}
