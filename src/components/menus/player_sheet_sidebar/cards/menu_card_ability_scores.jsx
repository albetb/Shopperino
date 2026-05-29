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
const MIN_BONUS = -20;
const MAX_BONUS = 99;

function clamp(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function formatModifier(mod) {
  if (mod > 0) return `+${mod}`;
  return `${mod}`;
}

function formatBonus(n) {
  const v = Number(n) || 0;
  if (v === 0) return '0';
  return v > 0 ? `+${v}` : `${v}`;
}

export default function MenuCardAbilityScores({ isCollapsed, onToggleCollapse }) {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet.player);

  const [isEditing, setIsEditing] = useState(false);
  const [tempValues, setTempValues] = useState({});

  const enterEdit = () => {
    setTempValues(
      Object.fromEntries(
        ABILITY_KEYS.map((key) => [
          key,
          {
            base: player?.getAbilityBase?.(key) ?? DEFAULT_BASE,
            bonus: player?.getAbilityBonus?.(key) ?? 0,
          },
        ])
      )
    );
    setIsEditing(true);
  };

  const exitEdit = () => {
    setIsEditing(false);
    setTempValues({});
  };

  const saveAll = () => {
    ABILITY_KEYS.forEach((key) => {
      const v = tempValues[key] ?? { base: DEFAULT_BASE, bonus: 0 };
      dispatch(onSetAbilityBase(key, clamp(v.base, MIN_BASE, MAX_BASE)));
      dispatch(onSetAbilityBonus(key, clamp(v.bonus, MIN_BONUS, MAX_BONUS)));
    });
    exitEdit();
  };

  const updateTemp = (key, kind, delta) => {
    const min = kind === 'base' ? MIN_BASE : MIN_BONUS;
    const max = kind === 'base' ? MAX_BASE : MAX_BONUS;
    setTempValues((prev) => {
      const cur = prev[key] ?? { base: DEFAULT_BASE, bonus: 0 };
      return {
        ...prev,
        [key]: { ...cur, [kind]: clamp((cur[kind] ?? 0) + delta, min, max) },
      };
    });
  };

  const allDefault = player && ABILITY_KEYS.every(
    (key) => player.getAbilityBase(key) === 10 && player.getAbilityBonus(key) === 0
  );
  const displayTitle = allDefault ? (
    <><span className="material-symbols-outlined" style={{ color: 'var(--danger)' }}>priority_high</span> Ability</>
  ) : 'Ability';

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

  const titleContent = isEditing ? (
    <>
      <button
        type="button"
        className="ability-title-save"
        onClick={saveAll}
        title="Save"
        aria-label="Save"
      >
        <span className="material-symbols-outlined">check</span>
      </button>
      <h3 className="card-title">Editing ability</h3>
    </>
  ) : (
    <>
      <span
        className="ability-title-icon"
        onClick={(e) => { e.stopPropagation(); if (isCollapsed) onToggleCollapse(); enterEdit(); }}
        title="Edit ability scores"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') { if (isCollapsed) onToggleCollapse(); enterEdit(); } }}
        aria-label="Edit ability scores"
      >
        <span className="material-symbols-outlined">edit</span>
      </span>
      <h3 className="card-title">{displayTitle}</h3>
    </>
  );

  return (
    <div className={`card ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="card-side-div card-expand-div" onClick={!isEditing ? onToggleCollapse : undefined}>
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
          {isEditing ? (
            <div className="ability-edit-rows">
              <div className="ability-edit-row ability-edit-row--head">
                <span className="ability-edit-row-label" aria-hidden="true" />
                <span className="ability-edit-row-col-label">Base</span>
                <span className="ability-edit-row-col-label">Bonus</span>
              </div>
              {ABILITY_KEYS.map((key) => {
                const v = tempValues[key] ?? { base: DEFAULT_BASE, bonus: 0 };
                return (
                  <div key={key} className="ability-edit-row">
                    <label className="ability-edit-row-label">{ABILITY_LABELS[key]}</label>
                    <div className="ability-edit-row-controls">
                      <button
                        type="button"
                        className="levels-button small"
                        onClick={() => updateTemp(key, 'base', -1)}
                        aria-label={`Decrease ${ABILITY_LABELS[key]} base`}
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <div className="level-frame">
                        <span className="level-text">{v.base}</span>
                      </div>
                      <button
                        type="button"
                        className="levels-button small"
                        onClick={() => updateTemp(key, 'base', 1)}
                        aria-label={`Increase ${ABILITY_LABELS[key]} base`}
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                    <div className="ability-edit-row-controls">
                      <button
                        type="button"
                        className="levels-button small"
                        onClick={() => updateTemp(key, 'bonus', -1)}
                        aria-label={`Decrease ${ABILITY_LABELS[key]} bonus`}
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <div className="level-frame">
                        <span className="level-text">{formatBonus(v.bonus)}</span>
                      </div>
                      <button
                        type="button"
                        className="levels-button small"
                        onClick={() => updateTemp(key, 'bonus', 1)}
                        aria-label={`Increase ${ABILITY_LABELS[key]} bonus`}
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
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
                      <div>{total}</div>
                      <div className="ability-modifier">{formatModifier(mod)}</div>
                    </div>
                  );
                })}
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
