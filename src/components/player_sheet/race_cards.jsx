import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isMobile } from '../../lib/utils';
import { onSetCharacterRace } from '../../store/thunks/playerSheetThunks';
import { setIsPlayerSheetSidebarCollapsed, setPlayerSheetMainView } from '../../store/slices/playerSheetSlice';
import '../../style/menu_cards.css';

const RACE_INFO = {
  Human: [
    'Land speed: 30 feet',
    '- 1 extra feat at 1st level.',
    '- 4 extra skill points at 1st level and 1 extra skill point at each additional level.',
  ],
  Dwarf: [
    '+2 Constitution, -2 Charisma',
    'Land speed: 20 feet, can move at this speed even when wearing medium/heavy armor or when carrying a medium/heavy load',
    'Vision: Darkvision 60 feet',
    '- Dwarven waraxes and Dwarven urgroshes are martial weapons.',
    '- Stonecunning: +2 Search checks to notice unusual stonework',
    '- Stability: +4 ability checks to resist being bull rushed or tripped when standing on the ground',
  ],
  Elf: [
    '+2 Dexterity, -2 Constitution',
    'Land speed: 30 feet',
    'Vision: Low-Light Vision',
    '- Martial Weapon Proficiency feats for the Longsword, Rapier, Longbow, Composite longbow, Shortbow, and Composite shortbow as bonus feats.',
    '- +2 Listen, Search, and Spot checks.',
    '- An elf who merely passes within 5 feet of a secret or concealed door is entitled to a Search check to notice it as if she were actively looking for it.',
    '- Immunity to magic sleep effects',
    '- +2 saving throws against enchantment spells or effects',
  ],
  Gnome: [
    '+2 Constitution, -2 Strength',
    'Size: Small',
    '- +1 to Armor Class',
    '- +1 on attack rolls',
    '- +4 on Hide checks',
    '- Uses smaller weapons',
    '- 3/4x lifting and carrying limits',
    'Land speed: 20 feet',
    'Vision: Low-Light Vision',
    '- Gnome hooked hammers are martial weapons.',
    '- +2 Listen and Craft (alchemy) checks',
    '- +2 saving throws against illusions',
    '- Add +1 to the Difficulty Class for all saving throws against illusion spells cast by gnomes',
    '- +1 attack rolls against kobolds and goblinoids (including goblins, hobgoblins, and bugbears)',
    '- +4 dodge bonus to Armor Class against monsters of the giant type (such as ogres, trolls, and hill giants)',
    '- 1/day speak with animals (burrowing mammal only, duration 1 minute). ',
    '- If Charisma score >= 10; 1/day dancing lights, ghost sound, prestidigitation.',
    '- Caster level 1st; save DC 10 + gnome\'s Cha modifier + spell level.',
  ],
  'Half-Elf': [
    'Land speed: 30 feet',
    'Vision: Low-Light Vision',
    '- +1 Listen, Search, and Spot checks',
    '- +2 Diplomacy and Gather Information checks',
    '- Immunity to sleep spells and similar magical effects',
    '- +2 saving throws against enchantment spells or effects',
    'Elven Blood: Half-elves are considered elves for all effects related to race, and are vulnerable to special effects that affect elves as their elf ancestors are, and can use magic items that are only usable by elves.',
  ],
  'Half-Orc': [
    '+2 Strength, -2 Intelligence, -2 Charisma',
    'Land speed: 30 feet',
    'Vision: Darkvision 60 feet',
    'Orc Blood: Half-orcs are considered orcs for all effects related to race, and are vulnerable to special effects that affect orcs as their orc ancestors are, and can use magic items that are only usable by orcs.',
  ],
  Halfling: [
    '+2 Dexterity, -2 Strength',
    'Size: Small',
    '- +1 to Armor Class',
    '- +1 on attack rolls',
    '- +4 on Hide checks',
    '- Uses smaller weapons',
    '- 3/4x lifting and carrying limits',
    'Land speed: 20 feet',
    '- +2 Climb, Jump, Move Silently, and Listen checks',
    '- +1 saving throws',
    '- +2 morale bonus on saving throws against fear',
    '- +1 attack rolls with thrown weapons and slings',
  ],
};

function renderLine(line, index) {
  const trimmed = (line || '').trim();
  if (!trimmed) return null;
  const isBullet = trimmed.startsWith('- ');
  const content = isBullet ? trimmed.slice(2) : trimmed;
  const parts = content.split(/:(.+)/);
  if (parts.length < 2) {
    return (
      <p key={index} className="text-left">
        {isBullet ? '• ' : ''}
        {content}
      </p>
    );
  }
  const title = parts[0];
  const rest = parts[1];
  return (
    <p key={index} className="text-left">
      {isBullet ? '• ' : ''}
      <strong>{title.trim()}:</strong>
      {rest}
    </p>
  );
}

export default function RaceCards() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet.player);
  const currentRace = player?.getRace?.() ?? '';
  const [collapsed, setCollapsed] = useState(() =>
    Object.fromEntries(Object.keys(RACE_INFO).map(name => [name, true]))
  );

  const races = useMemo(() => Object.keys(RACE_INFO), []);

  const toggleCard = (name) => {
    setCollapsed(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSelect = (name) => {
    dispatch(onSetCharacterRace(name));
    dispatch(setPlayerSheetMainView('none'));
    if (isMobile()) {
      dispatch(setIsPlayerSheetSidebarCollapsed(true));
    }
  };

  return (
    <div className="player-sheet-race-cards">
      {races.map(name => {
        const isCollapsed = collapsed[name];
        const lines = RACE_INFO[name] || [];
        const isCurrent = currentRace === name;
        return (
          <div key={name} className={`card card-width-spellbook ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="card-side-div card-expand-div" onClick={() => toggleCard(name)}>
              <h3 className="card-title">{name}</h3>
              <button className="collapse-button">
                <span className="material-symbols-outlined">
                  {isCollapsed ? 'expand_more' : 'expand_less'}
                </span>
              </button>
            </div>
            {!isCollapsed && (
              <div className="card-content">
                {lines.map((line, idx) => renderLine(line, idx))}
                <div className="card-side-div buttons-row-center margin-top">
                  <button
                    className="modern-button small-long"
                    onClick={() => handleSelect(name)}
                    disabled={isCurrent}
                  >
                    Select
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

