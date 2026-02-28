import { useState } from 'react';
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

export default function MenuCardAbilityScores() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet.player);

  const [editingKey, setEditingKey] = useState(null);
  const [editingMode, setEditingMode] = useState(null); // 'base' | 'bonus'
  const [tempValue, setTempValue] = useState(0);

  const startEditBase = (key) => {
    const base = player?.getAbilityBase?.(key) ?? DEFAULT_BASE;
    setEditingKey(key);
    setEditingMode('base');
    setTempValue(base);
  };

  const startEditBonus = (key) => {
    const bonus = player?.getAbilityBonus?.(key) ?? 0;
    setEditingKey(key);
    setEditingMode('bonus');
    setTempValue(bonus);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditingMode(null);
  };

  const acceptEdit = () => {
    if (editingKey && editingMode) {
      if (editingMode === 'base') {
        dispatch(onSetAbilityBase(editingKey, clamp(tempValue, MIN_BASE, MAX_BASE)));
      } else {
        dispatch(onSetAbilityBonus(editingKey, clamp(tempValue, MIN_BONUS, MAX_BONUS)));
      }
    }
    cancelEdit();
  };

  const decrement = () => setTempValue((v) => clamp(v - 1, editingMode === 'base' ? MIN_BASE : MIN_BONUS, editingMode === 'base' ? MAX_BASE : MAX_BONUS));
  const increment = () => setTempValue((v) => clamp(v + 1, editingMode === 'base' ? MIN_BASE : MIN_BONUS, editingMode === 'base' ? MAX_BASE : MAX_BONUS));

  if (!player) {
    return (
      <p className="modal-body-muted">Select a character to edit ability scores.</p>
    );
  }

  return (
    <>
      {ABILITY_KEYS.map((key) => {
        const isEditingBase = editingKey === key && editingMode === 'base';
        const isEditingBonus = editingKey === key && editingMode === 'bonus';
        const total = player.getAbilityTotal(key);
        const mod = player.getModifier(key);

        if (isEditingBase) {
          return (
            <div key={key} className="card-side-div margin-top ability-row">
              <label className="modern-label">{ABILITY_LABELS[key]}</label>
              <div className="levels-div">
                <button type="button" className="levels-button small" onClick={decrement} aria-label="Decrease">
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <div className="level-frame">
                  <label className="level-text">{tempValue}</label>
                </div>
                <button type="button" className="levels-button small" onClick={increment} aria-label="Increase">
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <button type="button" className="levels-button small" onClick={acceptEdit} aria-label="Accept">
                <span className="material-symbols-outlined">check</span>
              </button>
            </div>
          );
        }

        if (isEditingBonus) {
          return (
            <div key={key} className="card-side-div margin-top ability-row">
              <label className="modern-label">Bonus</label>
              <div className="levels-div">
                <button type="button" className="levels-button small" onClick={decrement} aria-label="Decrease">
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <div className="level-frame">
                  <label className="level-text">{tempValue}</label>
                </div>
                <button type="button" className="levels-button small" onClick={increment} aria-label="Increase">
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <button type="button" className="levels-button small" onClick={acceptEdit} aria-label="Accept">
                <span className="material-symbols-outlined">check</span>
              </button>
            </div>
          );
        }

        return (
          <div key={key} className="card-side-div margin-top ability-row ability-row-display">
            <label className="modern-label ability-label">{ABILITY_LABELS[key]}</label>
            <span className="ability-total">{total}</span>
            <sup className="ability-mod">{formatModifier(mod)}</sup>
            <div className="ability-actions">
              <button type="button" className="levels-button small" onClick={() => startEditBase(key)} title="Edit base score" aria-label="Edit base">
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button type="button" className="levels-button small" onClick={() => startEditBonus(key)} title="Edit bonus" aria-label="Edit bonus">
                <span className="material-symbols-outlined">add_circle</span>
              </button>
              {/* <button type="button" className="levels-button small" title="Roll (to be implemented)" aria-label="Roll dice">
                <span className="material-symbols-outlined">casino</span>
              </button> */}
            </div>
          </div>
        );
      })}
    </>
  );
}
