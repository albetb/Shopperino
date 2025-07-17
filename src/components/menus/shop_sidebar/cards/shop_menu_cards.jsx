import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import * as db from '../../../../lib/storage';
import { isMobile, trimLine } from '../../../../lib/utils';
import MenuCardCity from './menu_card_city';
import MenuCardShop from './menu_card_shop';
import MenuCardWorld from './menu_card_world';
import '../../../../style/menu_cards.css';

export default function ShopMenuCards() {
  const [cardStates, setCardStates] = useState([
    { id: 1, collapsed: false },
    { id: 2, collapsed: false },
    { id: 3, collapsed: false }
  ]);

  const worlds = useSelector(state => state.world.worlds.map(w => w.Name));
  const selectedWorld = useSelector(state => state.world.selectedWorld?.Name);
  const playerLevel = useSelector(state => state.world.world?.Level) ?? 1;

  const cities = useSelector(state => state.world.world?.Cities.map(c => c.Name) || []);
  const selectedCity = useSelector(state => state.city.city?.Name);
  const cityLevel = useSelector(state => state.city.city?.Level) ?? 1;

  const shops = useSelector(state => state.city.city?.Shops.map(s => s.Name) || []);
  const selectedShop = useSelector(state => state.shop.shop?.Name);
  const shopLevel = useSelector(state => state.shop.shop?.Level) ?? 0;

  // Initialize collapse state from db
  useEffect(() => {
    setCardCollapsed(1, db.getIsWorldCollapsed());
    setCardCollapsed(2, db.getIsCityCollapsed());
    setCardCollapsed(3, db.getIsShopCollapsed());
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
        if (cardId === 1) db.setIsWorldCollapsed(newState);
        if (cardId === 2) db.setIsCityCollapsed(newState);
        if (cardId === 3) db.setIsShopCollapsed(newState);
        return { ...s, collapsed: newState };
      }
      return s;
    }));
  };

  const cards = [
    { id: 1, title: 'World', saved: worlds, selected: selectedWorld, level: playerLevel },
    { id: 2, title: 'City', saved: cities, selected: selectedCity, level: cityLevel },
    { id: 3, title: 'Shop', saved: shops, selected: selectedShop, level: shopLevel }
  ];

  const trimLength = isMobile() ? 23 : 10;
  const formatTitle = ({ id, title, saved, selected, level }) => {
    if (saved.length === 0) return title;
    const displayName = trimLine(selected || saved[0], trimLength);
    return `${title} - ${displayName} - Lv: ${level}`;
  };

  return (
    <div className="cards">
      {cards.map(card => {
        const state = cardStates.find(s => s.id === card.id);
        if (card.id === 2 && worlds.length === 0) return null;
        if (card.id === 3 && cities.length === 0) return null;
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
                {card.id === 1 && <MenuCardWorld />}
                {card.id === 2 && <MenuCardCity />}
                {card.id === 3 && <MenuCardShop />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
