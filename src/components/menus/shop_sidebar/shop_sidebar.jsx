import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../../store/slices/appSlice';
import '../../../style/sidebar.css';
import ShopMenuCards from './cards/shop_menu_cards';

export default function ShopSidebar() {
  const dispatch = useDispatch();
  const isCollapsed = useSelector(state => state.app.sidebarCollapsed);

  const handleToggle = () => dispatch(toggleSidebar());

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-button" onClick={handleToggle}>
        <span className="material-symbols-outlined">
          {isCollapsed ? 'menu_open' : 'arrow_back_ios'}
        </span>
      </button>

      {!isCollapsed && (
        <>
          <ShopMenuCards />
        </>
      )}
    </div>
  );
}
