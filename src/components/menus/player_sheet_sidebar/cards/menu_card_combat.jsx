import { useDispatch, useSelector } from 'react-redux';
import { setPlayerSheetMainView, setIsPlayerSheetSidebarCollapsed } from '../../../../store/slices/playerSheetSlice';
import { setPlayerSpellbookPage, setPlayerSpellbookClassDescCollapsed, setPlayerSpellbookLevelCollapsed } from '../../../../store/slices/playerSheetSlice';
import { getClassData } from '../../../../lib/player';
import { isMobile, signed } from '../../../../lib/utils';
import Bar from '../../../common/Bar';
import '../../../../style/menu_cards.css';

function hasSpellcastingClass(player) {
  if (!player) return false;
  const _class = player.getClass();
  const level = player.getLevel();
  const data = getClassData(_class);
  if (!data || !data.hasSpells) return false;
  if (['Ranger', 'Paladin'].includes(_class) && level < 4) return false;
  return true;
}

export default function MenuCardCombat() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet.player);
  const mainView = useSelector(state => state.playerSheet.mainView ?? 'none');

  const maxHp = player?.getMaxLife() ?? 0;
  const currentHp = player?.getCurrentHp() ?? 0;
  // Mirror the combat page bar: gradient HP variant when healthy, switch
  // to a solid-red "dying" variant when currentHp <= 0 (full bar at 0 HP
  // emptying to -10 HP). See combat_page.jsx for the same logic.
  const isDying = currentHp <= 0;
  const hpRatio = isDying
    ? Math.max(0, Math.min(1, (currentHp + 10) / 10))
    : (maxHp > 0 ? Math.max(0, Math.min(1, currentHp / maxHp)) : 0);
  const hpBarVariant = isDying ? 'danger' : 'hp';
  const isCombatActive = mainView === 'combat';

  const openCombat = () => {
    dispatch(setPlayerSheetMainView('combat'));
    if (isMobile()) dispatch(setIsPlayerSheetSidebarCollapsed(true));
  };

  const race = player?.getRace?.() ?? '';
  const playerClass = player?.getClass?.() ?? '';
  const showSpellsContent = race === 'Gnome' || hasSpellcastingClass(player);

  const openSpells = () => {
    dispatch(setPlayerSheetMainView('playerSpells'));
    if (isMobile()) dispatch(setIsPlayerSheetSidebarCollapsed(true));
  };

  const playerSpellbookPage = useSelector((s) => s.playerSheet.playerSpellbookPage);
  const isOnSpellsPage = mainView === 'playerSpells';
  const isLearnActive = isOnSpellsPage && playerSpellbookPage === 0;
  const isPrepareActive = isOnSpellsPage && playerSpellbookPage === 1;
  const isSpellbookActive = isOnSpellsPage && playerSpellbookPage === 2;
  const isLearnVisible = ['Sorcerer', 'Wizard', 'Bard'].includes(playerClass);
  const isPrepareVisible = ['Wizard', 'Cleric', 'Druid', 'Ranger', 'Paladin'].includes(playerClass);
  const isGnomeOnly = race === 'Gnome' && !hasSpellcastingClass(player);
  const showSpellbookButton = !!playerClass || race === 'Gnome';
  const buttonClass = `modern-button ${playerClass === 'Wizard' ? 'small-middle-long3' : 'small-middle-long2'}`;
  const setPage = (p) => dispatch(setPlayerSpellbookPage(p));
  const openSpellbook = () => {
    dispatch(setPlayerSpellbookPage(2));
    dispatch(setPlayerSpellbookClassDescCollapsed(true));
    dispatch(setPlayerSpellbookLevelCollapsed([false, false, false, false, false, false, false, false, false, false]));
    dispatch(setPlayerSheetMainView('playerSpells'));
    if (isMobile()) dispatch(setIsPlayerSheetSidebarCollapsed(true));
  };

  return (
    <>
      <div className="player-sheet-combat-hp-bar card-side-div margin-top">
        <Bar value={hpRatio} variant={hpBarVariant} />
      </div>
      <div className="player-sheet-combat-stats card-side-div margin-top">
        <div className="player-sheet-combat-stats-row">
          <div className="player-sheet-combat-stat-cell">
            <span className="material-symbols-outlined" title="Base speed">directions_walk</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span className="material-symbols-outlined" title="Initiative">schedule</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span className="material-symbols-outlined" title="Armor class">shield</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span className="player-sheet-combat-save-label">F</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span className="player-sheet-combat-save-label">R</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span className="player-sheet-combat-save-label">W</span>
          </div>
        </div>
        <div className="player-sheet-combat-stats-row">
          <div className="player-sheet-combat-stat-cell">
            <span>{player?.getBaseSpeed?.() ?? 30}</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span>{signed(player?.getInitiativeModifier?.() ?? 0)}</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span>{player?.getArmorClass?.() ?? 10}</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span>{signed(player?.getFortitudeSave?.() ?? 0)}</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span>{signed(player?.getReflexSave?.() ?? 0)}</span>
          </div>
          <div className="player-sheet-combat-stat-cell">
            <span>{signed(player?.getWillSave?.() ?? 0)}</span>
          </div>
        </div>
      </div>
      <div className="card-side-div margin-top buttons-row-center" style={{ gap: '0.5rem' }}>
        <button
          type="button"
          className={`modern-button small-middle-long2${isCombatActive ? ' opacity-50' : ''}`}
          onClick={openCombat}
          /* Keep visually faded via opacity-50 but stay clickable — clicking
             again on the active page still closes the sidebar on mobile. */
          title="Combat"
        >
          <span className="material-symbols-outlined">swords</span>
        </button>
      </div>

      {showSpellsContent && (
        <>
          <hr className="player-sheet-combat-spells-divider" />
          {showSpellbookButton && (
            <div className="card-side-div margin-top buttons-row">
              {!isGnomeOnly && isLearnVisible && (
                <button
                  type="button"
                  className={`${buttonClass}${isLearnActive ? ' opacity-50' : ''}`}
                  onClick={() => { setPage(0); openSpells(); }}
                  /* See note above the Combat button — active page stays
                     clickable so it can close the sidebar on mobile. */
                  title="Learn"
                >
                  <span className="material-symbols-outlined">bookmark_add</span>
                </button>
              )}
              {!isGnomeOnly && isPrepareVisible && (
                <button
                  type="button"
                  className={`${buttonClass}${isPrepareActive ? ' opacity-50' : ''}`}
                  onClick={() => { setPage(1); openSpells(); }}
                  /* Same as combat / learn buttons — active stays clickable. */
                  title="Prepare"
                >
                  <span className="material-symbols-outlined">menu_book</span>
                </button>
              )}
              <button
                type="button"
                className={`${buttonClass}${isSpellbookActive ? ' opacity-50' : ''}`}
                onClick={openSpellbook}
                /* Same as the other sidebar nav buttons. */
                title="Open spellbook"
              >
                <span className="material-symbols-outlined">wand_stars</span>
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
