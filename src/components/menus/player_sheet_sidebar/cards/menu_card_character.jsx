import { useDispatch, useSelector } from 'react-redux';
import { setPlayerSheetMainView, setIsPlayerSheetSidebarCollapsed } from '../../../../store/slices/playerSheetSlice';
import { isMobile } from '../../../../lib/utils';
import '../../../../style/menu_cards.css';

const ROWS = [
  {
    id: 'inventory',
    label: 'Inventory',
    icon: 'savings',
    mainView: 'inventory',
    right: 'gold', // x {coin}
  },
  {
    id: 'skills',
    label: 'Skills',
    icon: 'psychology',
    mainView: 'skills',
    right: 'skillPoints', // x/y {rule}
    labelAlert: 'skills',
  },
  {
    id: 'feats',
    label: 'Feats',
    icon: 'auto_awesome',
    mainView: 'feats',
    right: 'featPoints', // x/y {rule}
    labelAlert: 'feats',
  },
  {
    id: 'features',
    label: 'Features',
    icon: 'extension',
    mainView: 'features',
    right: null,
  },
];

export default function MenuCardCharacter() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet.player);
  const mainView = useSelector((state) => state.playerSheet.mainView ?? 'none');

  const open = (mainViewKey) => {
    dispatch(setPlayerSheetMainView(mainViewKey));
    if (isMobile()) dispatch(setIsPlayerSheetSidebarCollapsed(true));
  };

  const skillTotal = player?.getTotalSkillPoints?.() ?? 0;
  const skillUsed = player?.getUsedSkillPoints?.() ?? 0;
  const featMax = player?.getFeatPointsMax?.() ?? 1;
  const featUsed = player?.getFeatPointsUsed?.() ?? 0;
  const gold = Math.floor(player?.getGold?.() ?? 0);

  const getRowLabel = (row) => {
    if (row.labelAlert === 'skills' && skillUsed < skillTotal) return '[!] Skills';
    if (row.labelAlert === 'feats' && featUsed < featMax) return '[!] Feats';
    return row.label;
  };

  const renderRight = (row) => {
    if (row.right === 'gold') {
      return (
        <span className="player-sheet-character-right">
          {gold} <span className="material-symbols-outlined" title="Gold">monetization_on</span>
        </span>
      );
    }
    if (row.right === 'skillPoints') {
      return (
        <span className="player-sheet-character-right">
          {skillUsed}/{skillTotal} <span className="material-symbols-outlined" title="Ability points">rule</span>
        </span>
      );
    }
    if (row.right === 'featPoints') {
      return (
        <span className="player-sheet-character-right">
          {featUsed}/{featMax} <span className="material-symbols-outlined" title="Feats">rule</span>
        </span>
      );
    }
    return null;
  };

  return (
    <>
    <div className="player-sheet-character-rows">
      {ROWS.map((row) => (
        <div key={row.id} className="player-sheet-character-row">
          <span className="player-sheet-character-label">{getRowLabel(row)}</span>
          <div className="player-sheet-button-row">
            <div className="player-sheet-character-right-wrap">
              {renderRight(row)}
            </div>
            <button
              type="button"
              className={`modern-button small-middle${mainView === row.mainView ? ' opacity-50' : ''}`}
              onClick={() => open(row.mainView)}
              disabled={mainView === row.mainView}
              title={row.label}
            >
              <span className="material-symbols-outlined">{row.icon}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
    </>
  );
}
