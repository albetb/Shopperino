import { useEffect, useState } from 'react';
import * as db from '../../../../lib/storage';
import { isMobile, trimLine } from '../../../../lib/utils';
import '../../../../style/menu_cards.css';
import MenuCardLoot from './menu_card_loot';

export default function LootMenuCards() {
  const [cardStates, setCardStates] = useState([
    { id: 1, collapsed: false }
  ]);

  useEffect(() => {
    setCardCollapsed(1, db.getIsLootCollapsed());
  }, []);

  const setCardCollapsed = (cardId, collapsed) => {
    setCardStates(states => states.map(s =>
      s.id === cardId ? { ...s, collapsed } : s
    ));
  };

  const toggleCard = (cardId) => {
    setCardStates(states => states.map(s => {
      if (s.id === cardId) {
        const newState = !s.collapsed;
        if (cardId === 1) db.setIsLootCollapsed(newState);
        return { ...s, collapsed: newState };
      }
      return s;
    }));
  };

  const cards = [
    { id: 1, title: 'Loot generation' },
  ];

  const trimLength = isMobile() ? 23 : 10;
  const formatTitle = ({ id, title, saved, selected, level, _class }) => {
    if (!saved || saved.length === 0) return title;
    const displayName = trimLine(selected || saved[0], trimLength);
    return `${displayName} - ${_class} lv${level}`;
  };

  return (
    <div className="cards">
      {cards.map(card => {
        const state = cardStates.find(s => s.id === card.id);
        return (
          <div key={card.id} className={`card ${state.collapsed ? 'collapsed' : ''}`}>
            <div className="card-side-div card-expand-div" onClick={() => toggleCard(card.id)}>
              <h3 className="card-title">{formatTitle(card)}</h3>
              <button className="collapse-button">
                <span className="material-symbols-outlined">
                  {state.collapsed ? 'expand_more' : 'expand_less'}
                </span>
              </button>
            </div>
            {!state.collapsed && (
              <div className="card-content">
                {card.id === 1 && <MenuCardLoot />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
