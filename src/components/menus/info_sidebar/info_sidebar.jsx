import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isMobile } from '../../../lib/utils';
import {
  clearInfoCards,
  removeCard,
  toggleInfoSidebar
} from '../../../store/slices/appSlice';
import { useBackButtonHandler } from '../../hooks/use_back_button';
import InfoMenuCards from './cards/info_menu_cards';
import '../../../style/sidebar.css';

export default function InfoSidebar() {
  const dispatch = useDispatch();
  const isCollapsed = useSelector(state => state.app.infoSidebarCollapsed);
  const shopBarIsCollapsed = useSelector(state => state.app.sidebarCollapsed);
  const spellBarIsCollapsed = useSelector(state => state.spellbook.isSpellbookSidebarCollapsed);
  const currentTab = useSelector(state => state.app.currentTab);
  const cardsData = useSelector(state => state.app.infoCards);

  const otherBarIsCollapsed =
    currentTab === 1 ? shopBarIsCollapsed :
      currentTab === 2 ? spellBarIsCollapsed :
        false;

  const handleToggle = useCallback(
    () => dispatch(toggleInfoSidebar()),
    [dispatch]
  );
  const handleClearInfoCards = useCallback(
    () => dispatch(clearInfoCards()),
    [dispatch]
  );
  const handleCloseCard = useCallback(
    card => dispatch(removeCard(card)),
    [dispatch]
  );

  useBackButtonHandler(!isCollapsed, handleToggle);

  if (
    cardsData.length === 0 ||
    (isMobile() && !otherBarIsCollapsed)
  ) {
    return null;
  }

  return (
    <div className={`info-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="info-toggle-button" onClick={handleToggle}>
        <span className="material-symbols-outlined">
          {isCollapsed ? 'manage_search' : 'arrow_forward_ios'}
        </span>
      </button>

      {!isCollapsed && (
        <>
          <button
            className="saving-button delete-info-button"
            onClick={handleClearInfoCards}
          >
            <span className="material-symbols-outlined">delete</span>
          </button>

          <InfoMenuCards
            cardsData={cardsData}
            closeCard={handleCloseCard}
          />
        </>
      )}
    </div>
  );
}
