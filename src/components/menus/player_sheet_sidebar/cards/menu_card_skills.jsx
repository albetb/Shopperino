import { useDispatch, useSelector } from 'react-redux';
import { setPlayerSheetMainView, setIsPlayerSheetSidebarCollapsed } from '../../../../store/slices/playerSheetSlice';
import { isMobile } from '../../../../lib/utils';
import '../../../../style/menu_cards.css';

export default function MenuCardSkills() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet.player);

  const total = player?.getTotalSkillPoints() ?? 0;
  const used = player?.getUsedSkillPoints() ?? 0;
  const openSkills = () => {
    dispatch(setPlayerSheetMainView('skills'));
    if (isMobile()) dispatch(setIsPlayerSheetSidebarCollapsed(true));
  };

  return (
    <div className="card-side-div margin-top player-sheet-inventory-row">
      <div className="player-sheet-inventory-spacer" aria-hidden />
      <button
        type="button"
        className="modern-button small-middle-long2"
        onClick={openSkills}
        title="Skills"
      >
        <span className="material-symbols-outlined">psychology</span>
      </button>
      <div className="player-sheet-skills-points-wrap">
        <span className="player-sheet-skills-points">
          <span className="material-symbols-outlined" title="Ability points">rule</span>
          <span>{used}/{total}</span>
        </span>
      </div>
    </div>
  );
}
