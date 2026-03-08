import { useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addCardByLink } from '../../store/slices/appSlice';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import {
  onRemoveInventoryItem,
  onEquipItem,
  onUnequipSlot,
} from '../../store/thunks/playerSheetThunks';
import { getEquipType } from '../../lib/equipType';
import InventoryItemRow from './inventory/InventoryItemRow';
import InventoryOptionsPopup from './inventory/InventoryOptionsPopup';
import EquipmentCard from './inventory/EquipmentCard';
import '../../style/menu_cards.css';
import '../../style/player_sheet.css';
import '../../style/shop_inventory.css';

export default function InventoryPage() {
  const dispatch = useDispatch();
  const player = useSelector((state) => state.playerSheet?.player);
  const combatPageCardsCollapsed = useSelector(
    (state) => state.playerSheet?.combatPageCardsCollapsed ?? { player: false, combat: false, items: false }
  );

  const [popupState, setPopupState] = useState(null);

  const inventory = useMemo(() => player?.getInventory?.() ?? [], [player]);
  const equipment = useMemo(() => player?.getEquipment?.() ?? {}, [player]);

  const getEffectById = useCallback(
    (effectId) => {
      const item = inventory.find((inv) => inv.effectId === effectId);
      return item;
    },
    [inventory]
  );

  const handleOptionsClick = (e, itemName, itemType, itemNumber, itemLink) => {
    const equipType = getEquipType({ ItemType: itemType, Link: itemLink });
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupState({
      itemName,
      itemType,
      itemNumber,
      itemLink,
      equipType,
      position: { x: rect.right, y: rect.bottom },
    });
  };

  const handleEquipItem = (slot) => {
    if (!popupState) return;
    const itemData = {
      name: popupState.itemName,
      link: popupState.itemLink,
      twoHanded: popupState.equipType === 'two-hand',
    };

    if (slot.startsWith('set')) {
      // Two-handed weapon - set both hands
      const setNum = slot === 'set1' ? '1' : '2';
      const lhSlot = `lh${setNum}`;
      const rhSlot = `rh${setNum}`;
      dispatch(onEquipItem(lhSlot, { ...itemData, twoHanded: true }));
      dispatch(onEquipItem(rhSlot, { ...itemData, twoHanded: true }));
    } else {
      dispatch(onEquipItem(slot, itemData));
    }
  };

  const handleUnequipSlot = (slot) => {
    if (slot.startsWith('set')) {
      // Two-handed weapon - clear both hands
      const setNum = slot === 'set1' ? '1' : '2';
      dispatch(onUnequipSlot(`lh${setNum}`));
      dispatch(onUnequipSlot(`rh${setNum}`));
    } else {
      dispatch(onUnequipSlot(slot));
    }
  };

  const handleRemoveItem = (itemName, itemType, number) => {
    dispatch(onRemoveInventoryItem(itemName, itemType, number));
  };

  const handleOpenCard = (links, bonus) => {
    dispatch(addCardByLink({ links, bonus }));
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <EquipmentCard
        equipment={equipment}
        equipmentCollapsed={combatPageCardsCollapsed.items}
        setEquipmentCollapsed={(setter) => {
          const newState = typeof setter === 'function' ? setter(combatPageCardsCollapsed.items) : setter;
          dispatch(
            setCombatPageCardCollapsed({
              ...combatPageCardsCollapsed,
              items: newState,
            })
          );
        }}
        onUnequip={handleUnequipSlot}
        onOpenCard={handleOpenCard}
        player={player}
      />

      <div className="card card-width-spellbook">
        <h2 className="player-sheet-note-title">Inventory Items</h2>
        {inventory.length === 0 ? (
          <p className="modal-body-muted text-center">No items in inventory</p>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th className="align-right">Qty</th>
                <th>Name</th>
                <th>Type</th>
                <th className="col-action" />
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, idx) => (
                <InventoryItemRow
                  key={idx}
                  item={item}
                  idx={idx}
                  onOptionsClick={handleOptionsClick}
                  onOpenCard={handleOpenCard}
                  getEffectById={getEffectById}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {popupState && (
        <InventoryOptionsPopup
          itemName={popupState.itemName}
          itemType={popupState.itemType}
          itemNumber={popupState.itemNumber}
          equipType={popupState.equipType}
          position={popupState.position}
          onClose={() => setPopupState(null)}
          onRemove={handleRemoveItem}
          onEquip={handleEquipItem}
        />
      )}
    </div>
  );
}
