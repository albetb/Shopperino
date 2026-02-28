import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import '../../../../style/menu_cards.css';
import MenuCardPlayerSheet from './menu_card_player_sheet';

export default function PlayerSheetMenuCards() {
  const [collapsed, setCollapsed] = useState(false);
  const player = useSelector(state => state.playerSheet.player);

  const title = useMemo(() => {
    const name = player?.getName?.() ?? '';
    const race = player?.getRace?.() ?? '';
    const _class = player?.getClass?.() ?? '';
    const level = player?.getLevel?.() ?? 1;
    if (!name || !race || !_class) return 'Create a new character';
    return `${race} ${_class} lv${level}`;
  }, [player]);

  return (
    <div className="cards">
      <div className={`card ${collapsed ? 'collapsed' : ''}`}>
        <div className="card-side-div card-expand-div" onClick={() => setCollapsed(c => !c)}>
          <h3 className="card-title">{title}</h3>
          <button className="collapse-button">
            <span className="material-symbols-outlined">
              {collapsed ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
        {!collapsed && (
          <div className="card-content">
            <MenuCardPlayerSheet />
          </div>
        )}
      </div>
    </div>
  );
}

