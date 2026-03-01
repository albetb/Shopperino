import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPlayerSheetMainView, setIsPlayerSheetSidebarCollapsed } from '../../../../store/slices/playerSheetSlice';
import { setPlayerSpellbookPage, setPlayerSpellbookClassDescCollapsed, setPlayerSpellbookLevelCollapsed } from '../../../../store/slices/playerSheetSlice';
import { onSetPlayerSpellOption } from '../../../../store/thunks/playerSheetThunks';
import Spellbook from '../../../../lib/spellbook';
import { playerToSpellbookData } from '../../../../lib/player/playerSpellbookAdapter';
import { getClassData } from '../../../../lib/player';
import { isMobile } from '../../../../lib/utils';
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
  const hpPct = maxHp > 0 ? Math.min(100, Math.round((currentHp / maxHp) * 100)) : 0;
  const isCombatActive = mainView === 'combat';

  const openCombat = () => {
    dispatch(setPlayerSheetMainView('combat'));
    if (isMobile()) dispatch(setIsPlayerSheetSidebarCollapsed(true));
  };

  const race = player?.getRace?.() ?? '';
  const playerClass = player?.getClass?.() ?? '';
  const showSpellsContent = race === 'Gnome' || hasSpellcastingClass(player);

  const spellbookInstance = useMemo(() => {
    const data = playerToSpellbookData(player);
    if (!data) return null;
    return new Spellbook().load(data);
  }, [player]);

  const possibleDomain1 = spellbookInstance?.getPossibleDomain1?.() ?? [];
  const possibleDomain2 = spellbookInstance?.getPossibleDomain2?.() ?? [];
  const possibleSpecialized = spellbookInstance?.getPossibleSpecialized?.() ?? [];
  const possibleForbidden1 = spellbookInstance?.getPossibleForbidden1?.() ?? [];
  const possibleForbidden2 = spellbookInstance?.getPossibleForbidden2?.() ?? [];

  const domain1 = player?.domain1 ?? '';
  const domain2 = player?.domain2 ?? '';
  const specialized = player?.specialized ?? '';
  const forbidden1 = player?.forbidden1 ?? '';
  const forbidden2 = player?.forbidden2 ?? '';

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

  const setOption = (key, value) => {
    dispatch(onSetPlayerSpellOption(key, value));
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

      {showSpellsContent && (
        <>
          <hr className="player-sheet-combat-spells-divider" />
          {playerClass === 'Cleric' && (
            <>
              <div className="card-side-div margin-top">
                <label className="modern-label">Domains:</label>
                <select
                  className="modern-dropdown small-long"
                  value={domain1}
                  onChange={(e) => setOption('domain1', e.target.value)}
                >
                  <option value="">-</option>
                  {possibleDomain1.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="card-side-div margin-top">
                <label className="modern-label"></label>
                <select
                  className="modern-dropdown small-long"
                  value={domain2}
                  onChange={(e) => setOption('domain2', e.target.value)}
                >
                  <option value="">-</option>
                  {possibleDomain2.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          {playerClass === 'Wizard' && (
            <>
              <div className="card-side-div margin-top">
                <label className="modern-label">Specialized:</label>
                <select
                  className="modern-dropdown small-long"
                  value={specialized}
                  onChange={(e) => setOption('specialized', e.target.value)}
                >
                  <option value="">-</option>
                  {possibleSpecialized.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="card-side-div margin-top">
                <label className="modern-label">Forbidden:</label>
                <select
                  className="modern-dropdown small-long"
                  value={forbidden1}
                  onChange={(e) => setOption('forbidden1', e.target.value)}
                >
                  <option value="">-</option>
                  {possibleForbidden1.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {specialized !== 'Divination' && (
                <div className="card-side-div margin-top">
                  <label className="modern-label"></label>
                  <select
                    className="modern-dropdown small-long"
                    value={forbidden2}
                    onChange={(e) => setOption('forbidden2', e.target.value)}
                  >
                    <option value="">-</option>
                    {possibleForbidden2.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          {showSpellbookButton && (
            <div className="card-side-div margin-top buttons-row">
              {!isGnomeOnly && isLearnVisible && (
                <button
                  type="button"
                  className={`${buttonClass}${isLearnActive ? ' opacity-50' : ''}`}
                  onClick={() => { setPage(0); openSpells(); }}
                  disabled={isLearnActive}
                  title="Learn"
                >
                  <span className="material-symbols-outlined">document_search</span>
                </button>
              )}
              {!isGnomeOnly && isPrepareVisible && (
                <button
                  type="button"
                  className={`${buttonClass}${isPrepareActive ? ' opacity-50' : ''}`}
                  onClick={() => { setPage(1); openSpells(); }}
                  disabled={isPrepareActive}
                  title="Prepare"
                >
                  <span className="material-symbols-outlined">fact_check</span>
                </button>
              )}
              <button
                type="button"
                className={`${buttonClass}${isSpellbookActive ? ' opacity-50' : ''}`}
                onClick={openSpellbook}
                disabled={isSpellbookActive}
                title="Open spellbook"
              >
                <span className="material-symbols-outlined">menu_book</span>
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
