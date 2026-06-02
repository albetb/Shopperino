import { useMemo } from 'react';
import { loadFile, getItemByRef, getWeaponType } from '../../../lib/utils';

function effectTableForItem(itemLink) {
  if (!itemLink) return null;
  if (/\/(Specific )?Shield\//i.test(itemLink)) return 'Magic Shield';
  if (/\/(Specific )?Armor\//i.test(itemLink)) return 'Magic Armor';
  const raw = getItemByRef(itemLink)?.raw;
  if (!raw) return null;
  if (raw['Dmg (M)'] || raw['Dmg (S)']) {
    const { isRanged } = getWeaponType(raw);
    return isRanged ? 'Magic Ranged Weapon' : 'Magic Melee Weapon';
  }
  return null;
}

export default function EquipBonusControls({ itemLink, masterwork, bonus, effectIds, onChange }) {
  const tableName = effectTableForItem(itemLink);
  const effects = useMemo(() => {
    if (!tableName) return [];
    const tables = loadFile('tables');
    return Array.isArray(tables?.[tableName]) ? tables[tableName] : [];
  }, [tableName]);

  if (!tableName) return null;

  // bonus > 0 implies masterwork (a +X weapon is already masterwork).
  const mwLocked = bonus > 0;
  const mwChecked = mwLocked || masterwork;
  const showEffects = bonus >= 1;

  const handleBonusDelta = (delta) => {
    const next = Math.max(0, Math.min(5, bonus + delta));
    if (next === 0) {
      // Effects require an enhancement bonus; clear them when bonus drops to 0.
      onChange({ bonus: 0, effectIds: [] });
    } else {
      onChange({ bonus: next });
    }
  };

  return (
    <div className="equip-bonus-controls">
      <div className="equip-bonus-row">
        <label className="equip-bonus-mw">
          <input
            type="checkbox"
            checked={mwChecked}
            disabled={mwLocked}
            onChange={(e) => onChange({ masterwork: e.target.checked })}
          />
          <span>MW</span>
        </label>
        <div className="equip-bonus-stepper">
          <button
            type="button"
            className="equip-bonus-step-btn"
            onClick={() => handleBonusDelta(-1)}
            aria-label="Decrease enhancement"
          >−</button>
          <span className="equip-bonus-val">+{bonus}</span>
          <button
            type="button"
            className="equip-bonus-step-btn"
            onClick={() => handleBonusDelta(1)}
            aria-label="Increase enhancement"
          >+</button>
        </div>
      </div>
      {showEffects && effects.length > 0 && (
        <div className="equip-bonus-effects">
          {effects.map(eff => {
            const selected = effectIds.includes(eff.id);
            const desc = typeof eff.Description === 'string'
              ? eff.Description.replace(/<[^>]+>/g, '').slice(0, 240)
              : '';
            return (
              <button
                key={eff.id}
                type="button"
                className={`equip-bonus-chip${selected ? ' sel' : ''}`}
                onClick={() => onChange({
                  effectIds: selected
                    ? effectIds.filter(id => id !== eff.id)
                    : [...effectIds, eff.id],
                })}
                title={desc}
              >
                {eff.Name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
