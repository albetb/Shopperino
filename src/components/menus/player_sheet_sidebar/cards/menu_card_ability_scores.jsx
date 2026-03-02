import { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { ABILITY_KEYS } from '../../../../lib/player';
import { onSetAbilityBase, onSetAbilityBonus } from '../../../../store/thunks/playerSheetThunks';
import '../../../../style/menu_cards.css';

const ABILITY_LABELS = {
  str: 'Str',
  dex: 'Dex',
  con: 'Con',
  int: 'Int',
  wis: 'Wis',
  cha: 'Cha',
};

const MIN_BASE = 0;
const MAX_BASE = 99;
const DEFAULT_BASE = 10;
const MIN_BONUS = 0;
const MAX_BONUS = 99;

function clamp(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function formatModifier(mod) {
  if (mod >= 0) return `+${mod}`;
  return `${mod}`;
}

export default function MenuCardAbilityScores({ isCollapsed, onToggleCollapse }) {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet.player);

  const [editMode, setEditMode] = useState(null); // null | 'base' | 'bonus'
  const [tempValues, setTempValues] = useState({});

  const enterEditBase = () => {
    setTempValues(
      Object.fromEntries(
        ABILITY_KEYS.map((key) => [key, player?.getAbilityBase?.(key) ?? DEFAULT_BASE])
      )
    );
    setEditMode('base');
  };

  const enterEditBonus = () => {
    setTempValues(
      Object.fromEntries(
        ABILITY_KEYS.map((key) => [key, player?.getAbilityBonus?.(key) ?? 0])
      )
    );
    setEditMode('bonus');
  };

  const exitEdit = () => {
    setEditMode(null);
    setTempValues({});
  };

  const saveBase = () => {
    ABILITY_KEYS.forEach((key) => {
      dispatch(onSetAbilityBase(key, clamp(tempValues[key] ?? DEFAULT_BASE, MIN_BASE, MAX_BASE)));
    });
    exitEdit();
  };

  const saveBonus = () => {
    ABILITY_KEYS.forEach((key) => {
      dispatch(onSetAbilityBonus(key, clamp(tempValues[key] ?? 0, MIN_BONUS, MAX_BONUS)));
    });
    exitEdit();
  };

  const updateTemp = (key, delta) => {
    const min = editMode === 'base' ? MIN_BASE : MIN_BONUS;
    const max = editMode === 'base' ? MAX_BASE : MAX_BONUS;
    setTempValues((prev) => ({
      ...prev,
      [key]: clamp((prev[key] ?? 0) + delta, min, max),
    }));
  };

  const allDefault = player && ABILITY_KEYS.every(
    (key) => player.getAbilityBase(key) === 10 && player.getAbilityBonus(key) === 0
  );
  const displayTitle = allDefault ? '[!] Ability' : 'Ability';

  if (!player) {
    return (
      <div className={`card ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="card-side-div card-expand-div" onClick={onToggleCollapse}>
          <h3 className="card-title">Ability</h3>
          <button type="button" className="collapse-button">
            <span className="material-symbols-outlined">
              {isCollapsed ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
        {!isCollapsed && (
          <div className="card-content">
            <p className="modal-body-muted">Select a character to edit ability scores.</p>
          </div>
        )}
      </div>
    );
  }

  const titleContent = editMode ? (
    <>
      <button
        type="button"
        className="ability-title-save"
        onClick={editMode === 'base' ? saveBase : saveBonus}
        title="Save"
        aria-label="Save"
      >
        <span className="material-symbols-outlined">check</span>
      </button>
      <h3 className="card-title">
        {editMode === 'base' ? 'Editing base scores' : 'Editing bonuses'}
      </h3>
    </>
  ) : (
    <>
      <span
        className="ability-title-icon"
        onClick={(e) => { e.stopPropagation(); if (isCollapsed) onToggleCollapse(); enterEditBase(); }}
        title="Edit base ability scores"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') { if (isCollapsed) onToggleCollapse(); enterEditBase(); } }}
        aria-label="Edit base ability scores"
      >
        <span className="material-symbols-outlined">edit</span>
      </span>
      <span
        className="ability-title-icon"
        onClick={(e) => { e.stopPropagation(); if (isCollapsed) onToggleCollapse(); enterEditBonus(); }}
        title="Edit ability bonuses"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') { if (isCollapsed) onToggleCollapse(); enterEditBonus(); } }}
        aria-label="Edit ability bonuses"
      >
        <span className="material-symbols-outlined">add</span>
      </span>
      <h3 className="card-title">{displayTitle}</h3>
    </>
  );

  return (
    <div className={`card ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="card-side-div card-expand-div" onClick={!editMode ? onToggleCollapse : undefined}>
        <div className="ability-card-title-row">
          {titleContent}
        </div>
        <button type="button" className="collapse-button" onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}>
          <span className="material-symbols-outlined">
            {isCollapsed ? 'expand_more' : 'expand_less'}
          </span>
        </button>
      </div>

      {!isCollapsed && (
        <div className="card-content">
          {editMode ? (
            <div className="ability-edit-rows">
              {ABILITY_KEYS.map((key) => (
                <div key={key} className="ability-edit-row">
                  <label className="ability-edit-row-label">{ABILITY_LABELS[key]}</label>
                  <div className="ability-edit-row-controls">
                    <button
                      type="button"
                      className="levels-button small"
                      onClick={() => updateTemp(key, -1)}
                      aria-label={`Decrease ${ABILITY_LABELS[key]}`}
                    >
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                    <div className="level-frame">
                      <span className="level-text">{tempValues[key] ?? 0}</span>
                    </div>
                    <button
                      type="button"
                      className="levels-button small"
                      onClick={() => updateTemp(key, 1)}
                      aria-label={`Increase ${ABILITY_LABELS[key]}`}
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="ability-grid ability-grid-labels">
                {ABILITY_KEYS.map((key) => (
                  <div key={key} className="ability-grid-cell ability-label-cell">
                    {ABILITY_LABELS[key]}
                  </div>
                ))}
              </div>
              <div className="ability-grid ability-grid-scores">
                {ABILITY_KEYS.map((key) => {
                  const total = player.getAbilityTotal(key);
                  const mod = player.getModifier(key);
                  return (
                    <div key={key} className="ability-grid-cell ability-score-cell">
                      {total}
                      <sup>{formatModifier(mod)}</sup>
                    </div>
                  );
                })}
              </div>
              <div className="ability-grid ability-grid-dice">
                {ABILITY_KEYS.map((key) => (
                  <div key={key} className="ability-grid-cell ability-dice-cell">
                    <button type="button" className="ability-dice-button" disabled aria-label={`Roll ${ABILITY_LABELS[key]}`}>
                      <span className="material-symbols-outlined">casino</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

MenuCardAbilityScores.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
};
