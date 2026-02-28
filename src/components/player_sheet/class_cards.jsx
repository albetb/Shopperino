import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadFile, isMobile } from '../../lib/utils';
import { getClassData } from '../../lib/player';
import { onSetCharacterClass } from '../../store/thunks/playerSheetThunks';
import { setIsPlayerSheetSidebarCollapsed } from '../../store/slices/playerSheetSlice';
import StatBar from './stat_bar';
import '../../style/menu_cards.css';

const WEAPON_LOW = ['Bard', 'Druid', 'Monk', 'Rogue', 'Wizard'];
const WEAPON_MID = ['Cleric', 'Sorcerer'];
const WEAPON_HIGH = ['Barbarian', 'Fighter', 'Paladin', 'Ranger'];

const SPELLS_LOW = ['Paladin', 'Ranger'];
const SPELLS_MID = ['Bard'];
const SPELLS_HIGH = ['Wizard', 'Sorcerer', 'Cleric', 'Druid'];

function getLifeBar(hitDice) {
  const map = { d4: 1, d6: 2, d8: 3, d10: 4, d12: 5 };
  const filled = map[hitDice] ?? 0;
  return { filled, max: 5, value: hitDice || '—' };
}

function getAttackBar(baseAttack) {
  const map = { 'x1/2': 1, 'x3/4': 2, 'x1': 3 };
  const filled = map[baseAttack] ?? 0;
  return { filled, max: 3, value: baseAttack || '—' };
}

function getWeaponBar(className) {
  let filled = 1;
  let value = 'low';
  if (WEAPON_HIGH.includes(className)) {
    filled = 3;
    value = 'high';
  } else if (WEAPON_MID.includes(className)) {
    filled = 2;
    value = 'mid';
  } else if (WEAPON_LOW.includes(className)) {
    filled = 1;
    value = 'low';
  }
  return { filled, max: 3, value };
}

function getArmorBar(armorProficiency) {
  const map = { no: 0, light: 1, medium: 2, heavy: 3 };
  const filled = map[armorProficiency] ?? 0;
  const labels = { no: 'No', light: 'Light', medium: 'Medium', heavy: 'Heavy' };
  return { filled, max: 3, value: labels[armorProficiency] || armorProficiency || '—' };
}

function getSaveBar(save) {
  const filled = save === 'high' ? 2 : 1;
  return { filled, max: 2, value: save === 'high' ? 'high' : 'low' };
}

function getAbilitiesBar(skillPointsPerLevel) {
  const map = { 2: 1, 4: 2, 6: 3, 8: 4 };
  const filled = map[skillPointsPerLevel] ?? 0;
  return { filled, max: 4, value: String(skillPointsPerLevel ?? '—') };
}

function getSpellsBar(className, hasSpells) {
  if (!hasSpells) return { filled: 0, max: 3, value: 'no' };
  if (SPELLS_HIGH.includes(className)) return { filled: 3, max: 3, value: 'high' };
  if (SPELLS_MID.includes(className)) return { filled: 2, max: 3, value: 'mid' };
  if (SPELLS_LOW.includes(className)) return { filled: 1, max: 3, value: 'low' };
  return { filled: 0, max: 3, value: 'no' };
}

function getClassStats(className, data) {
  if (!data) return null;
  return {
    life: getLifeBar(data.hitDice),
    attack: getAttackBar(data.baseAttack),
    weapon: getWeaponBar(className),
    armor: getArmorBar(data.armorProficiency),
    fort: getSaveBar(data.fortSave),
    reflex: getSaveBar(data.reflexSave),
    will: getSaveBar(data.willSave),
    abilities: getAbilitiesBar(data.skillPointsPerLevel),
    spells: getSpellsBar(className, data.hasSpells),
  };
}

function renderFeature(text, index) {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;
  const colonIndex = trimmed.indexOf(':');
  const hasLabel = colonIndex > 0;
  const label = hasLabel ? trimmed.slice(0, colonIndex + 1) : '';
  const rest = hasLabel ? trimmed.slice(colonIndex + 1).trim() : trimmed;
  return (
    <p key={index} className="text-left player-sheet-class-feature">
      {label && <strong>{label}</strong>}
      {label ? ' ' : ''}
      {rest}
    </p>
  );
}

export default function ClassCards() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet.player);
  const currentClass = player?.getClass?.() ?? '';

  const classesData = useMemo(() => loadFile('classes') ?? {}, []);
  const classNames = useMemo(() => Object.keys(classesData).sort(), [classesData]);

  const [collapsed, setCollapsed] = useState({});
  const toggleCard = (name) => {
    setCollapsed(prev => ({ ...prev, [name]: prev[name] === false }));
  };
  const getCollapsed = (name) => collapsed[name] !== false;

  const handleSelect = (name) => {
    dispatch(onSetCharacterClass(name));
    if (isMobile()) {
      dispatch(setIsPlayerSheetSidebarCollapsed(true));
    }
  };

  return (
    <div className="player-sheet-class-cards">
      {classNames.map(name => {
        const data = getClassData(name) ?? classesData[name];
        const stats = getClassStats(name, data);
        const isCollapsed = getCollapsed(name);
        const isCurrent = currentClass === name;
        const features = (data?.shortClassFeatures?.length ? data.shortClassFeatures : data?.classFeatures) ?? [];

        return (
          <div key={name} className={`card card-width-spellbook ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="card-side-div card-expand-div" onClick={() => toggleCard(name)}>
              <h3 className="card-title">{name}</h3>
              <button className="collapse-button" type="button">
                <span className="material-symbols-outlined">
                  {isCollapsed ? 'expand_more' : 'expand_less'}
                </span>
              </button>
            </div>
            {!isCollapsed && (
              <div className="card-content">
                {stats && (
                  <div className="player-sheet-class-bars">
                    <StatBar label="Life" {...stats.life} />
                    <StatBar label="Attack" {...stats.attack} />
                    {/* <StatBar label="Weapon" {...stats.weapon} /> */}
                    <StatBar label="Armor" {...stats.armor} />
                    <StatBar label="Abilities" {...stats.abilities} />
                    <StatBar label="Spells" {...stats.spells} />
                    <div className="player-sheet-class-bars-saves">
                      <StatBar label="Fort" {...stats.fort} className="short" />
                      <StatBar label="Reflex" {...stats.reflex} className="short" />
                      <StatBar label="Will" {...stats.will} className="short" />
                    </div>
                  </div>
                )}
                <div className="player-sheet-class-features">
                  {features.map((text, idx) => renderFeature(text, idx))}
                </div>
                <div className="card-side-div buttons-row-center margin-top">
                  <button
                    className="modern-button small-long"
                    type="button"
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
