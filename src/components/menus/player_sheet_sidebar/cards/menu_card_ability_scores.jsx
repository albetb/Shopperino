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

  const [expandedKey, setExpandedKey] = useState(null);
  const [tempBase, setTempBase] = useState(DEFAULT_BASE);
  const [tempBonus, setTempBonus] = useState(0);

  const expand = (key) => {
    const base = player?.getAbilityBase?.(key) ?? DEFAULT_BASE;
    const bonus = player?.getAbilityBonus?.(key) ?? 0;
    setExpandedKey(key);
    setTempBase(base);
    setTempBonus(bonus);
  };

  const collapse = () => {
    setExpandedKey(null);
  };

  const save = () => {
    if (expandedKey) {
      dispatch(onSetAbilityBase(expandedKey, clamp(tempBase, MIN_BASE, MAX_BASE)));
      dispatch(onSetAbilityBonus(expandedKey, clamp(tempBonus, MIN_BONUS, MAX_BONUS)));
    }
    collapse();
  };

  const decrementBase = () => setTempBase((v) => clamp(v - 1, MIN_BASE, MAX_BASE));
  const incrementBase = () => setTempBase((v) => clamp(v + 1, MIN_BASE, MAX_BASE));
  const decrementBonus = () => setTempBonus((v) => clamp(v - 1, MIN_BONUS, MAX_BONUS));
  const incrementBonus = () => setTempBonus((v) => clamp(v + 1, MIN_BONUS, MAX_BONUS));

  if (!player) {
    return (
      <p className="modal-body-muted">Select a character to edit ability scores.</p>
    );
  }

  return (
    <>
      {ABILITY_KEYS.map((key) => {
        const isExpanded = expandedKey === key;
        const total = player.getAbilityTotal(key);
        const mod = player.getModifier(key);

        if (isExpanded) {
          return (
            <div key={key} className="ability-expanded-block">
              <div className="ability-expanded-row">
                <label className="ability-expanded-label">{ABILITY_LABELS[key]}</label>
                <span className="ability-expanded-filler" aria-hidden="true" />
                <div className="levels-div">
                  <button type="button" className="levels-button small" onClick={decrementBase} aria-label="Decrease base">
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <div className="level-frame">
                    <label className="level-text">{tempBase}</label>
                  </div>
                  <button type="button" className="levels-button small" onClick={incrementBase} aria-label="Increase base">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <span className="ability-expanded-filler" aria-hidden="true" />
                <button type="button" className="levels-button small" onClick={save} aria-label="Save" title="Save">
                  <span className="material-symbols-outlined">check</span>
                </button>
              </div>
              <div className="ability-expanded-row">
                <label className="ability-expanded-label ability-expanded-label-bonus">Bonus</label>
                <span className="ability-expanded-filler" aria-hidden="true" />
                <div className="levels-div">
                  <button type="button" className="levels-button small" onClick={decrementBonus} aria-label="Decrease bonus">
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <div className="level-frame">
                    <label className="level-text">{tempBonus}</label>
                  </div>
                  <button type="button" className="levels-button small" onClick={incrementBonus} aria-label="Increase bonus">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <span className="ability-expanded-filler" aria-hidden="true" />
                <span className="ability-expanded-spacer" aria-hidden="true" />
              </div>
            </div>
          );
        }

        return (
          <div key={key} className="card-side-div margin-top ability-row ability-row-display">
            <label className="modern-label ability-label">{ABILITY_LABELS[key]}</label>
            <span className="ability-total">{total}</span>
            <sup className="ability-mod">{formatModifier(mod)}</sup>
            <button
              type="button"
              className="levels-button small"
              onClick={() => expand(key)}
              title={`Edit ${ABILITY_LABELS[key]}`}
              aria-label={`Edit ${ABILITY_LABELS[key]}`}
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
          </div>
        );
      })}
    </>
  );
}
