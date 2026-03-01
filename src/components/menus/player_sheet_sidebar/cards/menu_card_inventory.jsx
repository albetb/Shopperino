import { useDispatch, useSelector } from 'react-redux';
import { setPlayerSheetMainView, setIsPlayerSheetSidebarCollapsed } from '../../../../store/slices/playerSheetSlice';
import { isMobile } from '../../../../lib/utils';
import '../../../../style/menu_cards.css';

export default function MenuCardInventory() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet.player);

  const weight = player?.getInventoryWeight?.() ?? 0;
  const openInventory = () => {
    dispatch(setPlayerSheetMainView('inventory'));
    if (isMobile()) dispatch(setIsPlayerSheetSidebarCollapsed(true));
  };

  return (
    <div className="card-side-div margin-top player-sheet-inventory-row">
      <div className="player-sheet-inventory-spacer" aria-hidden />
      <button
        type="button"
        className="modern-button small-middle-long2"
        onClick={openInventory}
        title="Inventory"
      >
        <span className="material-symbols-outlined">savings</span>
      </button>
      <div className="player-sheet-inventory-weight-wrap">
        <span className="player-sheet-inventory-weight">
          <span className="material-symbols-outlined" title="Weight">weight</span>
          <span>{weight}</span>
        </span>
      </div>
    </div>
  );
}
