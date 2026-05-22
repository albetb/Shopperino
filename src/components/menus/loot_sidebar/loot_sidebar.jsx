import { useDispatch, useSelector } from 'react-redux';
import { setIsLootSidebarCollapsed } from '../../../store/slices/lootSlice';
import { useBackButtonHandler } from 'components/hooks/useBackButton';
import { isMobile } from '../../../lib/utils';
import LootMenuCards from './cards/loot_menu_cards';
import '../../../style/sidebar.css';

export default function LootSidebar() {
  const dispatch = useDispatch();
  const isCollapsed = useSelector(state => state.loot.isLootSidebarCollapsed);

  const handleToggle = () => {
    dispatch(setIsLootSidebarCollapsed(!isCollapsed));
  };

  // On mobile the loot menu card lives inline at the top of LootInventory,
  // so the left sidebar (and its toggle button) is skipped entirely. Back
  // button handler is skipped here too — there's no open/close state on
  // mobile for the back gesture to consume.
  useBackButtonHandler(!isMobile() && !isCollapsed, handleToggle);

  if (isMobile()) return null;

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-button" onClick={handleToggle}>
        <span className="material-symbols-outlined">
          {isCollapsed ? 'menu_open' : 'chevron_left'}
        </span>
      </button>
      {!isCollapsed && <LootMenuCards />}
    </div>
  );
}
