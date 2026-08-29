import { useDispatch, useSelector } from 'react-redux';
import { setIsTrapSidebarCollapsed } from '../../../store/slices/trapSlice';
import { useBackButtonHandler } from 'components/hooks/useBackButton';
import { isMobile } from '../../../lib/utils';
import { TrapRollControls } from '../../trap/trap_page';
import '../../../style/sidebar.css';
import '../../../style/menu_cards.css';

/**
 * The trap generator's controls, in the same place the Shop and Loot
 * generators keep theirs.
 *
 * On a phone the sidebar is skipped entirely and the same controls render at
 * the top of the page — exactly what the Loot sidebar does, and for the same
 * reason.
 */
export default function TrapSidebar() {
  const dispatch = useDispatch();
  const isCollapsed = useSelector((state) => state.trap.isTrapSidebarCollapsed);

  const handleToggle = () => dispatch(setIsTrapSidebarCollapsed(!isCollapsed));

  useBackButtonHandler(!isMobile() && !isCollapsed, handleToggle);

  if (isMobile()) return null;

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-button" onClick={handleToggle}>
        <span className="material-symbols-outlined">
          {isCollapsed ? 'menu_open' : 'chevron_left'}
        </span>
      </button>
      {!isCollapsed && (
        <div className="cards cards-aligned">
          <div className="card">
            <div className="card-side-div">
              <h3 className="card-title">Trap generation</h3>
            </div>
            <div className="card-content">
              <TrapRollControls />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
