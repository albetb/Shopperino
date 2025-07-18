import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isMobile } from '../../../lib/utils';
import { toggleSidebar } from '../../../store/slices/appSlice';
import ShopMenuCards from './cards/shop_menu_cards';
import '../../../style/sidebar.css';

export default function ShopSidebar() {
  const dispatch = useDispatch();
  const isCollapsed = useSelector(state => state.app.sidebarCollapsed);

  const handleToggle = () => dispatch(toggleSidebar());

  useEffect(() => {
    if (!isMobile()) return;

    if (!isCollapsed) {
      window.history.pushState({ shopSidebar: 'open' }, '');
    }

    const onPopState = event => {
      if (!isCollapsed && event.state?.shopSidebar === 'open') {
        handleToggle();
        window.history.pushState({ shopSidebar: 'open' }, '');
      }
    };

    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
      if (!isCollapsed) {
        window.history.back();
      }
    };
  }, [isCollapsed]);

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-button" onClick={handleToggle}>
        <span className="material-symbols-outlined">
          {isCollapsed ? 'menu_open' : 'arrow_back_ios'}
        </span>
      </button>

      {!isCollapsed && <ShopMenuCards />}
    </div>
  );
}
