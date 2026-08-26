import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isMobile } from '../../../lib/utils';
import {
  clearInfoCards,
  removeCard,
  toggleInfoSidebar
} from '../../../store/slices/appSlice';
import { useBackButtonHandler } from 'components/hooks/useBackButton';
import InfoMenuCards from './cards/info_menu_cards';
import '../../../style/sidebar.css';

export default function InfoSidebar() {
  const dispatch = useDispatch();
  const isCollapsed = useSelector(state => state.app.infoSidebarCollapsed);
  const shopBarIsCollapsed = useSelector(state => state.app.sidebarCollapsed);
  const spellBarIsCollapsed = useSelector(state => state.spellbook.isSpellbookSidebarCollapsed);
  const lootBarIsCollapsed = useSelector(state => state.loot.isLootSidebarCollapsed);
  const currentTab = useSelector(state => state.app.currentTab);
  const cardsData = useSelector(state => state.app.infoCards);
  const sharedShop = useSelector(state => state.app.sharedShop);

  // When viewing shared shop (tab 1, no left bar), treat as "other bar collapsed" so info sidebar can show on mobile
  const otherBarIsCollapsed =
    currentTab === 1 ? (sharedShop ? true : shopBarIsCollapsed) :
      currentTab === 2 ? spellBarIsCollapsed :
        currentTab === 3 ? lootBarIsCollapsed :
          true;

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

  /* Pages that render no left sidebar of their own: Search, the Monster Book,
     and the shared-shop view. On mobile the two collapsed sidebars become FABs
     stacked down the right edge, so with no left one to sit under, the info
     FAB takes the top slot rather than leaving a gap where the missing button
     would have been. The class is set at every width — the rule that reads it
     lives in the mobile media query, so it costs nothing on desktop and
     survives a resize, which an isMobile() check in render would not. */
  const noLeftSidebar =
    currentTab === 4 || currentTab === 6 || (currentTab === 1 && !!sharedShop);

  return (
    <div className={`info-sidebar ${isCollapsed ? 'collapsed' : ''} ${noLeftSidebar ? 'info-sidebar--solo' : ''}`}>
      <button className="info-toggle-button" onClick={handleToggle}>
        <span className="material-symbols-outlined">
          {isCollapsed ? 'manage_search' : 'chevron_right'}
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
