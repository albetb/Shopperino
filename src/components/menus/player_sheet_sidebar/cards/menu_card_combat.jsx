import { useDispatch, useSelector } from 'react-redux';
import { setPlayerSheetMainView, setIsPlayerSheetSidebarCollapsed } from '../../../../store/slices/playerSheetSlice';
import { isMobile } from '../../../../lib/utils';
import '../../../../style/menu_cards.css';

export default function MenuCardCombat() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet.player);
  const mainView = useSelector(state => state.playerSheet.mainView ?? 'none');

  const maxHp = player?.getMaxLife() ?? 0;
  const currentHp = player?.getCurrentHp() ?? 0;
  const hpPct = maxHp > 0 ? Math.min(100, Math.round((currentHp / maxHp) * 100)) : 0;
  const isCombatActive = mainView === 'combat';

  const openCombat = () => {
    dispatch(setPlayerSheetMainView('combat'));
    if (isMobile()) dispatch(setIsPlayerSheetSidebarCollapsed(true));
  };

  return (
    <>
      <div className="player-sheet-combat-hp-bar card-side-div margin-top">
        <div className="player-sheet-stat-bar-track player-sheet-hp-bar-track" role="presentation">
          <div
            className="player-sheet-hp-bar-fill"
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>
      <div className="player-sheet-combat-stats card-side-div margin-top">
        <div className="player-sheet-combat-stats-row">
          <div className="player-sheet-combat-stat-cell">
            <span className="material-symbols-outlined" title="Base speed">directions_walk</span>
            <span>{player?.getBaseSpeed?.() ?? 30} ft.</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span className="material-symbols-outlined" title="Initiative">schedule</span>
            <span>+{player?.getInitiativeModifier?.() ?? 0}</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span className="material-symbols-outlined" title="Armor class">shield</span>
            <span>{player?.getArmorClass?.() ?? 10}</span>
          </div>
        </div>
        <div className="player-sheet-combat-stats-row">
          <div className="player-sheet-combat-stat-cell">
            <span className="player-sheet-combat-save-label">F</span>
            <span>+{player?.getFortitudeSave?.() ?? 0}</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span className="player-sheet-combat-save-label">R</span>
            <span>+{player?.getReflexSave?.() ?? 0}</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span className="player-sheet-combat-save-label">W</span>
            <span>+{player?.getWillSave?.() ?? 0}</span>
          </div>
        </div>
      </div>
      <div className="card-side-div margin-top buttons-row-center" style={{ gap: '0.5rem' }}>
        <button
          type="button"
          className={`modern-button small-middle-long2${isCombatActive ? ' opacity-50' : ''}`}
          onClick={openCombat}
          disabled={isCombatActive}
          title="Combat"
        >
          <span className="material-symbols-outlined">swords</span>
        </button>
      </div>
    </>
  );
}
