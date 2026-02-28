import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ABILITY_KEYS } from '../../../../lib/player';
import { setPlayerSheetCardCollapsed } from '../../../../store/slices/playerSheetSlice';
import '../../../../style/menu_cards.css';
import MenuCardPlayerSheet from './menu_card_player_sheet';
import MenuCardAbilityScores from './menu_card_ability_scores';
import MenuCardNotes from './menu_card_notes';

const PLACEHOLDER_CARD_TITLES = ['Combat', 'Skills', 'Inventory', 'Details'];

export default function PlayerSheetMenuCards() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet.player);
  const cardCollapsed = useSelector(state => state.playerSheet.cardCollapsed);

  const toggleCard = (key) => {
    dispatch(setPlayerSheetCardCollapsed({ key, value: !cardCollapsed[key] }));
  };

  const isCollapsed = (key) => !!cardCollapsed[key];

  const title = useMemo(() => {
    const name = player?.getName?.() ?? '';
    const race = player?.getRace?.() ?? '';
    const _class = player?.getClass?.() ?? '';
    const level = player?.getLevel?.() ?? 1;
    if (!name || !race || !_class) return 'Create a new character';
    return `${race} ${_class} lv${level}`;
  }, [player]);

  const hasRaceAndClass = !!(player?.getRace?.() && player?.getClass?.());

  const abilityScoresTitle = useMemo(() => {
    if (!player) return 'Ability scores';
    const allDefault = ABILITY_KEYS.every(
      (key) => player.getAbilityBase(key) === 10 && player.getAbilityBonus(key) === 0
    );
    return allDefault ? '[!] Ability scores' : 'Ability scores';
  }, [player]);

  return (
    <div className="cards">
      <div className={`card ${isCollapsed('identity') ? 'collapsed' : ''}`}>
        <div className="card-side-div card-expand-div" onClick={() => toggleCard('identity')}>
          <h3 className="card-title">{title}</h3>
          <button type="button" className="collapse-button">
            <span className="material-symbols-outlined">
              {isCollapsed('identity') ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
        {!isCollapsed('identity') && (
          <div className="card-content">
            <MenuCardPlayerSheet />
          </div>
        )}
      </div>

      {hasRaceAndClass && (
        <>
          <div className={`card ${isCollapsed('abilityScores') ? 'collapsed' : ''}`}>
            <div className="card-side-div card-expand-div" onClick={() => toggleCard('abilityScores')}>
              <h3 className="card-title">{abilityScoresTitle}</h3>
              <button className="collapse-button" type="button">
                <span className="material-symbols-outlined">
                  {isCollapsed('abilityScores') ? 'expand_more' : 'expand_less'}
                </span>
              </button>
            </div>
            {!isCollapsed('abilityScores') && (
              <div className="card-content">
                <MenuCardAbilityScores />
              </div>
            )}
          </div>

          {PLACEHOLDER_CARD_TITLES.map(cardTitle => (
            <div key={cardTitle} className={`card ${isCollapsed(cardTitle) ? 'collapsed' : ''}`}>
              <div
                className="card-side-div card-expand-div"
                onClick={() => toggleCard(cardTitle)}
              >
                <h3 className="card-title">{cardTitle}</h3>
                <button type="button" className="collapse-button">
                  <span className="material-symbols-outlined">
                    {isCollapsed(cardTitle) ? 'expand_more' : 'expand_less'}
                  </span>
                </button>
              </div>
              {!isCollapsed(cardTitle) && (
                <div className="card-content">
                  <p className="modal-body-muted">To be populated later.</p>
                </div>
              )}
            </div>
          ))}

          <div className={`card ${isCollapsed('Notes') ? 'collapsed' : ''}`}>
            <div
              className="card-side-div card-expand-div"
              onClick={() => toggleCard('Notes')}
            >
              <h3 className="card-title">Notes</h3>
              <button type="button" className="collapse-button">
                <span className="material-symbols-outlined">
                  {isCollapsed('Notes') ? 'expand_more' : 'expand_less'}
                </span>
              </button>
            </div>
            {!isCollapsed('Notes') && (
              <div className="card-content">
                <MenuCardNotes />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

