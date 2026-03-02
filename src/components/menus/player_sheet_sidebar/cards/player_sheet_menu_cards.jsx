import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPlayerSheetCardCollapsed } from '../../../../store/slices/playerSheetSlice';
import '../../../../style/menu_cards.css';
import MenuCardPlayerSheet from './menu_card_player_sheet';
import MenuCardAbilityScores from './menu_card_ability_scores';
import MenuCardNotes from './menu_card_notes';
import MenuCardCombat from './menu_card_combat';
import MenuCardCharacter from './menu_card_character';

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

  const combatTitle = useMemo(() => {
    if (!player) return 'Combat';
    const current = player.getCurrentHp();
    const max = player.getMaxLife();
    return `Combat - ${current}/${max} hp`;
  }, [player]);

  const characterTitle = useMemo(() => {
    if (!player) return 'Character';
    const skillUsed = player.getUsedSkillPoints();
    const skillTotal = player.getTotalSkillPoints();
    const featUsed = player.getFeatPointsUsed();
    const featMax = player.getFeatPointsMax();
    const showAlert = skillUsed < skillTotal || featUsed < featMax;
    return showAlert ? '[!] Character' : 'Character';
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
          <MenuCardAbilityScores
            isCollapsed={isCollapsed('abilityScores')}
            onToggleCollapse={() => toggleCard('abilityScores')}
          />

          <div className={`card ${isCollapsed('Combat') ? 'collapsed' : ''}`}>
            <div
              className="card-side-div card-expand-div"
              onClick={() => toggleCard('Combat')}
            >
              <h3 className="card-title">{combatTitle}</h3>
              <button type="button" className="collapse-button">
                <span className="material-symbols-outlined">
                  {isCollapsed('Combat') ? 'expand_more' : 'expand_less'}
                </span>
              </button>
            </div>
            {!isCollapsed('Combat') && (
              <div className="card-content">
                <MenuCardCombat />
              </div>
            )}
          </div>

          <div className={`card ${isCollapsed('Character') ? 'collapsed' : ''}`}>
            <div
              className="card-side-div card-expand-div"
              onClick={() => toggleCard('Character')}
            >
              <h3 className="card-title">{characterTitle}</h3>
              <button type="button" className="collapse-button">
                <span className="material-symbols-outlined">
                  {isCollapsed('Character') ? 'expand_more' : 'expand_less'}
                </span>
              </button>
            </div>
            {!isCollapsed('Character') && (
              <div className="card-content">
                <MenuCardCharacter />
              </div>
            )}
          </div>

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

