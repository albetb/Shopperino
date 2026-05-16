import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPlayerSheetMainView, setIsPlayerSheetSidebarCollapsed, setPlayerSpellbookPage } from '../../store/slices/playerSheetSlice';
import { getClassData } from '../../lib/player';
import useLongPress from '../hooks/useLongPress';
import Icon from '../common/Icon';

function hasSpellcastingClass(player) {
  if (!player) return false;
  const _class = player.getClass();
  const level = player.getLevel();
  const data = getClassData(_class);
  if (!data || !data.hasSpells) return false;
  if (['Ranger', 'Paladin'].includes(_class) && level < 4) return false;
  return true;
}

const ITEMS = [
  { id: 'combat',       icon: 'swords',       label: 'Combat'    },
  { id: 'inventory',    icon: 'backpack',     label: 'Inventory' },
  { id: 'skills',       icon: 'person_play',  label: 'Skills'    },
  { id: 'feats',        icon: 'auto_awesome', label: 'Feats'     },
  { id: 'features',     icon: 'extension',    label: 'Features'  },
  { id: 'playerSpells', icon: 'wand_stars',   label: 'Spells'    },
  { id: 'note',         icon: 'edit_note',    label: 'Notes'     },
];

export default function PlayerSheetBottomNav() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet.player);
  const mainView = useSelector(state => state.playerSheet.mainView ?? 'none');

  const [showSpellOptions, setShowSpellOptions] = useState(false);
  const spellPopupRef = useRef(null);
  const spellBtnRef = useRef(null);

  const race = player?.getRace?.() ?? '';
  const _class = player?.getClass?.() ?? '';
  const showSpells = race === 'Gnome' || hasSpellcastingClass(player);
  const isLearnVisible = ['Sorcerer', 'Wizard', 'Bard'].includes(_class);
  const isPrepareVisible = ['Wizard', 'Cleric', 'Druid', 'Ranger', 'Paladin'].includes(_class);

  const navigate = view => {
    dispatch(setPlayerSheetMainView(view));
    dispatch(setIsPlayerSheetSidebarCollapsed(true));
    setShowSpellOptions(false);
  };

  const handleSpellLongPress = useCallback(() => setShowSpellOptions(true), []);
  const handleSpellClick = useCallback(() => {
    dispatch(setPlayerSpellbookPage(2));
    navigate('playerSpells');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);
  const spellLongPress = useLongPress(handleSpellLongPress, handleSpellClick);

  const handlePrepareSpell = () => { dispatch(setPlayerSpellbookPage(1)); navigate('playerSpells'); };
  const handleLearnSpell   = () => { dispatch(setPlayerSpellbookPage(0)); navigate('playerSpells'); };

  useEffect(() => {
    if (!showSpellOptions) return undefined;
    const onDown = ev => {
      if (spellPopupRef.current?.contains(ev.target)) return;
      if (spellBtnRef.current?.contains(ev.target)) return;
      setShowSpellOptions(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [showSpellOptions]);

  const items = ITEMS.filter(it => it.id !== 'playerSpells' || showSpells);

  return (
    <nav className="sh-bnav" aria-label="Player sheet sections">
      {items.map(it => {
        if (it.id === 'playerSpells') {
          return (
            <button
              key={it.id}
              ref={spellBtnRef}
              type="button"
              className="sh-bnav-item"
              aria-current={mainView === 'playerSpells' ? 'page' : undefined}
              {...spellLongPress}
            >
              <Icon name={it.icon} />
              <span>{it.label}</span>
              {showSpellOptions && (
                <div className="sh-bnav-popout" ref={spellPopupRef}>
                  {isPrepareVisible && (
                    <button type="button" className="sh-bnav-popout-btn" onClick={handlePrepareSpell} title="Prepare Spell">
                      <Icon name="menu_book" />
                    </button>
                  )}
                  {isLearnVisible && (
                    <button type="button" className="sh-bnav-popout-btn" onClick={handleLearnSpell} title="Learn Spell">
                      <Icon name="bookmark_add" />
                    </button>
                  )}
                </div>
              )}
            </button>
          );
        }
        return (
          <button
            key={it.id}
            type="button"
            className="sh-bnav-item"
            aria-current={mainView === it.id ? 'page' : undefined}
            onClick={() => navigate(it.id)}
          >
            <Icon name={it.icon} />
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
