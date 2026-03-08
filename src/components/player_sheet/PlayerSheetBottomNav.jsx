import { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPlayerSheetMainView, setIsPlayerSheetSidebarCollapsed, setPlayerSpellbookPage } from '../../store/slices/playerSheetSlice';
import { getClassData } from '../../lib/player';
import useLongPress from '../hooks/useLongPress';

function hasSpellcastingClass(player) {
  if (!player) return false;
  const _class = player.getClass();
  const level = player.getLevel();
  const data = getClassData(_class);
  if (!data || !data.hasSpells) return false;
  if (['Ranger', 'Paladin'].includes(_class) && level < 4) return false;
  return true;
}

export default function PlayerSheetBottomNav() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet.player);
  const mainView = useSelector(state => state.playerSheet.mainView ?? 'none');
  const [showSpellOptions, setShowSpellOptions] = useState(false);
  const [showSkillsOptions, setShowSkillsOptions] = useState(false);
  const spellPopupRef = useRef(null);
  const spellBtnRef = useRef(null);
  const skillsPopupRef = useRef(null);
  const skillsBtnRef = useRef(null);

  const race = player?.getRace?.() ?? '';
  const _class = player?.getClass?.() ?? '';
  const showSpells = race === 'Gnome' || hasSpellcastingClass(player);
  const isLearnVisible = ['Sorcerer', 'Wizard', 'Bard'].includes(_class);
  const isPrepareVisible = ['Wizard', 'Cleric', 'Druid', 'Ranger', 'Paladin'].includes(_class);

  const navigate = (view) => {
    dispatch(setPlayerSheetMainView(view));
    dispatch(setIsPlayerSheetSidebarCollapsed(true));
    setShowSpellOptions(false);
    setShowSkillsOptions(false);
  };

  const handleSpellLongPress = useCallback(() => {
    setShowSpellOptions(true);
  }, []);

  const handleSpellClick = useCallback(() => {
    dispatch(setPlayerSpellbookPage(2));
    navigate('playerSpells');
  }, [dispatch]);

  const spellLongPress = useLongPress(handleSpellLongPress, handleSpellClick);

  const handlePrepareSpell = () => {
    dispatch(setPlayerSpellbookPage(1));
    navigate('playerSpells');
  };

  const handleLearnSpell = () => {
    dispatch(setPlayerSpellbookPage(0));
    navigate('playerSpells');
  };

  const handleSkillsLongPress = useCallback(() => {
    setShowSkillsOptions(true);
  }, []);

  const handleSkillsClick = useCallback(() => {
    navigate('skills');
  }, [dispatch]);

  const skillsLongPress = useLongPress(handleSkillsLongPress, handleSkillsClick);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        spellPopupRef.current &&
        !spellPopupRef.current.contains(event.target) &&
        spellBtnRef.current &&
        !spellBtnRef.current.contains(event.target)
      ) {
        setShowSpellOptions(false);
      }
      if (
        skillsPopupRef.current &&
        !skillsPopupRef.current.contains(event.target) &&
        skillsBtnRef.current &&
        !skillsBtnRef.current.contains(event.target)
      ) {
        setShowSkillsOptions(false);
      }
    };

    if (showSpellOptions || showSkillsOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showSpellOptions, showSkillsOptions]);

  const btn = (view, icon, title) => (
    <button
      key={view}
      type="button"
      className={`ps-bottom-nav-btn${mainView === view ? ' ps-bottom-nav-btn--active' : ''}`}
      onClick={() => navigate(view)}
      title={title}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );

  const skillsBtn = (
    <div key="skillsBtn" style={{ position: 'relative', flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button
        ref={skillsBtnRef}
        type="button"
        className={`ps-bottom-nav-btn${mainView === 'skills' ? ' ps-bottom-nav-btn--active' : ''}`}
        title="Skills"
        {...skillsLongPress}
      >
        <span className="material-symbols-outlined">person_play</span>
      </button>
      {showSkillsOptions && (
        <div className="ps-skills-options-popup" ref={skillsPopupRef}>
          <button
            type="button"
            className="ps-skills-option-btn"
            onClick={() => navigate('feats')}
            title="Feats"
          >
            <span className="material-symbols-outlined">auto_awesome</span>
          </button>
          <button
            type="button"
            className="ps-skills-option-btn"
            onClick={() => navigate('features')}
            title="Features"
          >
            <span className="material-symbols-outlined">extension</span>
          </button>
        </div>
      )}
    </div>
  );

  const spellBtn = showSpells ? (
    <div key="spellBtn" style={{ position: 'relative', flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button
        ref={spellBtnRef}
        type="button"
        className={`ps-bottom-nav-btn${mainView === 'playerSpells' ? ' ps-bottom-nav-btn--active' : ''}`}
        title="Spells"
        {...spellLongPress}
      >
        <span className="material-symbols-outlined">wand_stars</span>
      </button>
      {showSpellOptions && (
        <div className="ps-spell-options-popup" ref={spellPopupRef}>
          {isPrepareVisible && (
            <button
              type="button"
              className="ps-spell-option-btn"
              onClick={handlePrepareSpell}
              title="Prepare Spell"
            >
              <span className="material-symbols-outlined">menu_book</span>
            </button>
          )}
          {isLearnVisible && (
            <button
              type="button"
              className="ps-spell-option-btn"
              onClick={handleLearnSpell}
              title="Learn Spell"
            >
              <span className="material-symbols-outlined">bookmark_add</span>
            </button>
          )}
        </div>
      )}
    </div>
  ) : null;

  return (
    <nav className="ps-bottom-nav">
      {btn('combat', 'swords', 'Combat')}
      {spellBtn}
      {btn('inventory', 'backpack', 'Inventory')}
      {skillsBtn}
    </nav>
  );
}
