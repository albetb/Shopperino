import { useDispatch, useSelector } from 'react-redux';
import { setIsLootSidebarCollapsed } from '../../../store/slices/lootSlice';
import { useBackButtonHandler } from '../../hooks/use_back_button';
import LootMenuCards from './cards/loot_menu_cards';
import '../../../style/sidebar.css';

export default function LootSidebar() {
  const dispatch = useDispatch();
  const isCollapsed = useSelector(state => state.loot.isLootSidebarCollapsed);

  const handleToggle = () => {
    dispatch(setIsLootSidebarCollapsed(!isCollapsed));
  };

  useBackButtonHandler(!isCollapsed, handleToggle);

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-button" onClick={handleToggle}>
        <span className="material-symbols-outlined">
          {isCollapsed ? 'menu_open' : 'arrow_back_ios'}
        </span>
      </button>
      {!isCollapsed && <LootMenuCards />}
    </div>
  );
}
