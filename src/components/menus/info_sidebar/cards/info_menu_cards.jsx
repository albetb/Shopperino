import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import parse, { domToReact } from 'html-react-parser';
import SpellLink from '../../../common/spell_link';
import '../../../../style/menu_cards.css';

export default function InfoMenuCards({ cardsData, closeCard }) {
  const [cardStates, setCardStates] = useState(
    cardsData.map((_, idx) => ({ id: idx, collapsed: idx !== 0 }))
  );

  useEffect(() => {
    setCardStates(
      cardsData.map((_, idx) => ({ id: idx, collapsed: idx !== 0 }))
    );
  }, [cardsData]);

  const toggleCard = id => {
    setCardStates(states =>
      states.map(s => (s.id === id ? { ...s, collapsed: !s.collapsed } : s))
    );
  };

  const descriptionOptions = {
    replace: domNode => {
      if (domNode.name === 'table') {
        const { style, ...rest } = domNode.attribs || {};
        return (
          <div className="description-table-wrapper">
            <table {...rest}>
              {domToReact(domNode.children, descriptionOptions)}
            </table>
          </div>
        );
      }
      if (
        domNode.name === 'a' &&
        domNode.attribs?.href
      ) {
        const href = domNode.attribs.href;
        let link = null;
        if (href && href.includes('abilitiesAndConditions#')) {
          link = href;
        } else if (href && href.includes('#')) {
          link = href;
        } else if (href && href.startsWith('#')) {
          link = href.slice(1);
        } else if (href && !href.includes('://')) {
          link = href;
        }
        if (link) {
          return (
            <SpellLink key={href} link={link}>
              {domToReact(domNode.children, descriptionOptions)}
            </SpellLink>
          );
        }
      }
    }
  };

  return (
    <div className="cards">
      {cardsData.map((data, idx) => {
        const state = cardStates.find(s => s.id === idx) || { collapsed: idx !== 0 };
        const title = data.Name || `Card ${idx + 1}`;
        return (
          <div key={idx} className={`card ${state.collapsed ? 'collapsed' : ''}`}>
            <div className="card-side-div card-expand-div">
              <h3 className="card-title" onClick={() => toggleCard(idx)}>{title}</h3>
              <div className="card-actions">
                <button className="close-button" onClick={() => closeCard(data)}>
                  <span className="material-symbols-outlined">close_small</span>
                </button>
                <button className="collapse-button" onClick={() => toggleCard(idx)}>
                  <span className="material-symbols-outlined">
                    {state.collapsed ? 'expand_more' : 'expand_less'}
                  </span>
                </button>
              </div>
            </div>
            {!state.collapsed && (
              <div className="card-content">
                {Object.entries(data).map(([key, value]) => {
                  if (key === 'Short Description') return null;
                  return (
                    <div key={key} className="info-card-row">
                      {['Link', 'Name', 'Description'].includes(key) ? null : (
                        <span className="info-key info-card">{key}: </span>
                      )}
                      {key === 'Description' ? (
                        <div className="info-value info-card description-content">
                          {parse(value, descriptionOptions)}
                        </div>
                      ) : ['Link', 'Name'].includes(key) ? null : (
                        <span className="info-value info-card">{value}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

InfoMenuCards.propTypes = {
  cardsData: PropTypes.arrayOf(PropTypes.object).isRequired,
  closeCard: PropTypes.func.isRequired
};

InfoMenuCards.defaultProps = {
  cardsData: []
};
