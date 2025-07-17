import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import * as db from '../../../../lib/storage';
import { isMobile, trimLine } from '../../../../lib/utils';
import MenuCardPlayer from './menu_card_player';
import MenuCardSearch from './menu_card_search';
import '../../../../style/menu_cards.css';

export default function SpellbookMenuCards() {
  const [cardStates, setCardStates] = useState([
    { id: 1, collapsed: false },
    { id: 2, collapsed: false }
  ]);

  const spellbooks = useSelector(state => state.spellbook.spellbooks);
  const selectedSpellbook = useSelector(state => state.spellbook.selectedSpellbook?.Name);
  const spellbook = useSelector(state => state.spellbook.spellbook) ?? null;
  const playerLevel = spellbook?.Level ?? 1;
  const playerClass = spellbook?.Class ?? "";

  // Initialize collapse state from db
  useEffect(() => {
    setCardCollapsed(1, db.getIsPlayerCollapsed());
    setCardCollapsed(2, db.getIsSearchCollapsed());
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
        if (cardId === 1) db.setIsPlayerCollapsed(newState);
        if (cardId === 2) db.setIsSearchCollapsed(newState);
        return { ...s, collapsed: newState };
      }
      return s;
    }));
  };

  const cards = [
    { id: 1, title: 'Spellbook', saved: spellbooks?.map(w => w.Name), selected: selectedSpellbook, level: playerLevel, _class: playerClass },
    { id: 2, title: 'Filter', saved: null, selected: null, level: null, class: null }
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
        if (card.id === 2 && !playerClass) return null;
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
                {card.id === 1 && <MenuCardPlayer />}
                {card.id === 2 && <MenuCardSearch />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
