import { useDispatch, useSelector } from 'react-redux';
import { setIsPlayerSheetSidebarCollapsed } from '../../../store/slices/playerSheetSlice';
import { useBackButtonHandler } from 'components/hooks/useBackButton';
import PlayerSheetMenuCards from './cards/player_sheet_menu_cards';
import '../../../style/sidebar.css';

export default function PlayerSheetSidebar() {
  const dispatch = useDispatch();
  const isCollapsed = useSelector(state => state.playerSheet.isPlayerSheetSidebarCollapsed);

  const handleToggle = () => {
    dispatch(setIsPlayerSheetSidebarCollapsed(!isCollapsed));
  };

  useBackButtonHandler(!isCollapsed, handleToggle);

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-button" onClick={handleToggle}>
        <span className="material-symbols-outlined">
          {isCollapsed ? 'menu_open' : 'arrow_back_ios'}
        </span>
      </button>
      {!isCollapsed && <PlayerSheetMenuCards />}
    </div>
  );
}
