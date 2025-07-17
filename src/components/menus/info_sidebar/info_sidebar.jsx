import { useDispatch, useSelector } from 'react-redux';
import { toggleInfoSidebar, clearInfoCards, removeCard } from '../../../store/slices/appSlice';
import '../../../style/sidebar.css';
import { isMobile } from '../../../lib/utils';
import InfoMenuCards from './cards/info_menu_cards';

export default function InfoSidebar() {
  const dispatch = useDispatch();
  const isCollapsed = useSelector(state => state.app.infoSidebarCollapsed);
  const shopBarIsCollapsed = useSelector(state => state.app.sidebarCollapsed);
  const spellBarIsCollapsed = useSelector(state => state.spellbook.isSpellbookSidebarCollapsed);
  const currentTab = useSelector(state => state.app.currentTab);
  const otherBarIsCollapsed = currentTab === 1 ? shopBarIsCollapsed
    : currentTab === 2 ? spellBarIsCollapsed : false;
  const cardsData = useSelector(state => state.app.infoCards);

  const handleToggle = () => dispatch(toggleInfoSidebar());
  const handleClearInfoCards = () => dispatch(clearInfoCards());
  const handleCloseCard = (card) => dispatch(removeCard(card));

  if (cardsData.length === 0
    || (isMobile() && !otherBarIsCollapsed)) return null;

  return (
    <div className={`info-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="info-toggle-button" onClick={handleToggle}>
        <span className="material-symbols-outlined">
          {isCollapsed ? 'manage_search' : 'arrow_forward_ios'}
        </span>
      </button>

      {!isCollapsed && (
        <>
          <button className="saving-button delete-info-button" onClick={handleClearInfoCards}>
            <span className="material-symbols-outlined">delete</span>
          </button>

          <InfoMenuCards cardsData={cardsData} closeCard={handleCloseCard} />
        </>
      )}
    </div>
  );
}
