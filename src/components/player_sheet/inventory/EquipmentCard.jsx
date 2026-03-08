import React from 'react';
import { getItemByRef, calculateWeaponAttackBonus, calculateWeaponDamage } from '../../../lib/utils';
import '../../../style/equipment_grid.css';

const SLOT_CONFIG = {
  lh1: { label: 'Left Hand 1', icon: 'game_button_l1' },
  rh1: { label: 'Right Hand 1', icon: 'game_button_r1' },
  lh2: { label: 'Left Hand 2', icon: 'game_button_l2' },
  rh2: { label: 'Right Hand 2', icon: 'game_button_r2' },
  armor: { label: 'Armor', icon: 'shield' },
  set1: { label: 'Set 1', icon: 'filter_1' },
  set2: { label: 'Set 2', icon: 'filter_2' },
  other1: { label: 'Slot 1', icon: 'looks_one' },
  other2: { label: 'Slot 2', icon: 'looks_two' },
  other3: { label: 'Slot 3', icon: 'looks_3' },
  other4: { label: 'Slot 4', icon: 'looks_4' },
};

function getEquipmentSlotsLayout(equipment) {
  const layout = [];

  // Check first hand pair (lh1 + rh1)
  const lh1Entry = equipment['lh1'];
  const rh1Entry = equipment['rh1'];
  const isTwoHandedSet1 = lh1Entry?.twoHanded || rh1Entry?.twoHanded;

  if (isTwoHandedSet1) {
    // Show as set1 (filter_1) full-width, but read equipment from lh1 or rh1
    const dataSlot = lh1Entry?.twoHanded ? 'lh1' : 'rh1';
    layout.push({ slots: ['set1'], fullWidth: true, dataSlot: { set1: dataSlot } });
  } else {
    // Show lh1 and rh1 side-by-side
    layout.push({ slots: ['lh1', 'rh1'] });
  }

  // Check second hand pair (lh2 + rh2)
  const lh2Entry = equipment['lh2'];
  const rh2Entry = equipment['rh2'];
  const isTwoHandedSet2 = lh2Entry?.twoHanded || rh2Entry?.twoHanded;

  if (isTwoHandedSet2) {
    // Show as set2 (filter_2) full-width, but read equipment from lh2 or rh2
    const dataSlot = lh2Entry?.twoHanded ? 'lh2' : 'rh2';
    layout.push({ slots: ['set2'], fullWidth: true, dataSlot: { set2: dataSlot } });
  } else {
    // Show lh2 and rh2 side-by-side
    layout.push({ slots: ['lh2', 'rh2'] });
  }

  // Armor
  layout.push({ slots: ['armor'], fullWidth: true });

  // Set slots (only show if they have equipment)
  const set1Entry = equipment['set1'];
  const set2Entry = equipment['set2'];

  // Only show set slots if they have equipment
  if (!isTwoHandedSet1 && !isTwoHandedSet2) {
    if (set1Entry) {
      layout.push({ slots: ['set1'], fullWidth: true });
    }
    if (set2Entry) {
      layout.push({ slots: ['set2'], fullWidth: true });
    }
  }

  layout.push({ slots: ['other1', 'other2'] });
  layout.push({ slots: ['other3', 'other4'] });

  return layout;
}

function EquipmentSlotBox({ slotKey, dataSlot, config, entry, onUnequip, onOpenCard, player }) {
  const isWeaponSlot = ['lh1', 'rh1', 'lh2', 'rh2', 'set1', 'set2'].includes(slotKey);
  const isArmorSlot = slotKey === 'armor';
  const isOtherSlot = ['other1', 'other2', 'other3', 'other4'].includes(slotKey);

  let attackBonus = null;
  let damage = null;
  let armorBonus = null;

  if (entry && entry.link && isWeaponSlot && player) {
    const weaponItem = getItemByRef(entry.link)?.raw;
    if (weaponItem) {
      attackBonus = calculateWeaponAttackBonus(player, { weaponItem, isTwoHanded: entry.twoHanded });
      damage = calculateWeaponDamage(player, { weaponItem, isTwoHanded: entry.twoHanded });
    }
  }

  if (entry && entry.link && isArmorSlot) {
    const armorItem = getItemByRef(entry.link)?.raw;
    if (armorItem && armorItem['Armor/Shield Bonus'] !== undefined) {
      armorBonus = armorItem['Armor/Shield Bonus'];
    }
  }

  return (
    <div className={`equipment-slot-box ${isOtherSlot ? 'slot-other' : ''}`}>
      <div className="slot-header">
        <div className="slot-icon">
          <span className="material-symbols-outlined">{config.icon}</span>
        </div>
        {entry && (
          <button
            type="button"
            className="slot-unequip-btn"
            onClick={() => onUnequip(dataSlot || slotKey)}
            title="Unequip"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>
      {entry ? (
        <div className="slot-content">
          {entry.link ? (
            <button
              type="button"
              className="button-link slot-item-name"
              onClick={() => onOpenCard(entry.link, 0)}
              title={entry.name}
            >
              {entry.name}
            </button>
          ) : (
            <span className="slot-item-name" title={entry.name}>
              {entry.name}
            </span>
          )}
          {attackBonus !== null && damage !== null && (
            <div className="slot-weapon-stats">
              <span className="slot-attack">+{attackBonus}</span>
              <span className="slot-damage">{damage}</span>
            </div>
          )}
          {armorBonus !== null && (
            <div className="slot-armor-bonus">
              {armorBonus} AC
            </div>
          )}
        </div>
      ) : (
        <div className="slot-empty" />
      )}
    </div>
  );
}

export default function EquipmentCard({
  equipment,
  equipmentCollapsed,
  setEquipmentCollapsed,
  onUnequip,
  onOpenCard,
  player,
}) {
  return (
    <div className={`card card-width-spellbook ${equipmentCollapsed ? 'collapsed' : ''}`}>
      <div
        className="card-side-div card-expand-div"
        onClick={() => setEquipmentCollapsed((c) => !c)}
      >
        <h3 className="card-title">Equipment</h3>
        <button type="button" className="collapse-button">
          <span className="material-symbols-outlined">
            {equipmentCollapsed ? 'expand_more' : 'expand_less'}
          </span>
        </button>
      </div>
      {!equipmentCollapsed && (
        <div className="card-content">
          <div className="equipment-grid">
            {getEquipmentSlotsLayout(equipment).map((row, rowIdx) => (
              <div key={rowIdx} className={`equipment-row ${row.fullWidth ? 'full-width' : ''}`}>
                {row.slots.map((slotKey) => {
                  const dataSlot = row.dataSlot?.[slotKey] || slotKey;
                  return (
                    <EquipmentSlotBox
                      key={slotKey}
                      slotKey={slotKey}
                      dataSlot={dataSlot}
                      config={SLOT_CONFIG[slotKey]}
                      entry={equipment[dataSlot] || null}
                      onUnequip={onUnequip}
                      onOpenCard={onOpenCard}
                      player={player}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
