import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addCardByLink } from '../../store/slices/appSlice';
import { getEffectById } from '../../lib/item/effectsUtils';
import { setCombatPageCardCollapsed } from '../../store/slices/playerSheetSlice';
import {
  onAddInventoryItem,
  onRemoveInventoryItem,
  onEquipItem,
  onUnequipSlot,
} from '../../store/thunks/playerSheetThunks';
import { getEquipType } from '../../lib/equipType';
import { loadFile } from '../../lib/utils';
import AddItemFormInventory from './inventory/AddItemFormInventory';
import InventoryItemRow from './inventory/InventoryItemRow';
import InventoryTableHeader from './inventory/InventoryTableHeader';
import InventoryOptionsPopup from './inventory/InventoryOptionsPopup';
import EquipmentCard from './inventory/EquipmentCard';
import CarryingCapacityCard from './inventory/CarryingCapacityCard';
import MoneyCard from './inventory/MoneyCard';
import Card from '../common/Card';
import Filigree from '../common/Filigree';
import Pill from '../common/Pill';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import IconButton from '../common/IconButton';
import '../../style/inventory.css';

export default function InventoryPage() {
  const dispatch = useDispatch();
  const player = useSelector(state => state.playerSheet?.player);
  const combatPageCardsCollapsed = useSelector(
    state => state.playerSheet?.combatPageCardsCollapsed ?? { player: false, combat: false, items: false }
  );

  const [popupState, setPopupState] = useState(null);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDesc, setSortDesc] = useState(false);

  const inventory = useMemo(() => player?.getInventory?.() ?? [], [player]);
  const equipment = useMemo(() => player?.getEquipment?.() ?? {}, [player]);
  const allItems = useMemo(() => {
    try {
      const itemsData = loadFile('items');
      const itemTypes = ['Good', 'Ammo', 'Weapon', 'Specific Weapon', 'Armor', 'Specific Armor', 'Shield', 'Specific Shield', 'Potion', 'Ring', 'Rod', 'Staff', 'Wand', 'Wondrous Item'];
      // items.json groups records under category keys but the item objects
      // themselves don't carry ItemType. Attach it on flatten so the
      // suggestion picker can set the right type dropdown and itemRefLink()
      // can build a real "items/Type/slug" reference — without this the
      // saved link is a bare slug and the row name isn't clickable later.
      return itemTypes.flatMap(type =>
        (itemsData[type] || []).map(item => ({ ...item, ItemType: type }))
      );
    } catch {
      return [];
    }
  }, []);


  const handleOptionsClick = (e, itemName, itemType, itemNumber, itemLink, itemMagic = {}) => {
    const equipType = getEquipType({ ItemType: itemType, Link: itemLink });
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupState({
      itemName, itemType, itemNumber, itemLink, equipType,
      masterwork: !!itemMagic.masterwork,
      bonus: Number(itemMagic.bonus) || 0,
      effectIds: Array.isArray(itemMagic.effectIds) ? itemMagic.effectIds : [],
      baseLink: typeof itemMagic.baseLink === 'string' ? itemMagic.baseLink : '',
      position: { x: rect.right, y: rect.bottom },
    });
  };

  const handleEquipItem = (slot) => {
    if (!popupState) return;
    const itemData = {
      name: popupState.itemName,
      link: popupState.itemLink,
      twoHanded: popupState.equipType === 'two-hand',
      masterwork: !!popupState.masterwork,
      bonus: Number(popupState.bonus) || 0,
      effectIds: Array.isArray(popupState.effectIds) ? popupState.effectIds : [],
      ...(popupState.baseLink ? { baseLink: popupState.baseLink } : {}),
    };
    if (slot.startsWith('set')) {
      const setNum = slot === 'set1' ? '1' : '2';
      dispatch(onEquipItem(`lh${setNum}`, { ...itemData, twoHanded: true }));
      dispatch(onEquipItem(`rh${setNum}`, { ...itemData, twoHanded: true }));
    } else {
      dispatch(onEquipItem(slot, itemData));
    }
  };

  const handleUnequipSlot = slot => {
    if (slot.startsWith('set')) {
      const setNum = slot === 'set1' ? '1' : '2';
      dispatch(onUnequipSlot(`lh${setNum}`));
      dispatch(onUnequipSlot(`rh${setNum}`));
    } else {
      dispatch(onUnequipSlot(slot));
    }
  };

  const handleRemoveItem = (itemName, itemType, number) => {
    if (!popupState) return dispatch(onRemoveInventoryItem(itemName, itemType, number));
    dispatch(onRemoveInventoryItem(itemName, itemType, number, {
      link: popupState.itemLink,
      masterwork: !!popupState.masterwork,
      bonus: Number(popupState.bonus) || 0,
      effectIds: Array.isArray(popupState.effectIds) ? popupState.effectIds : [],
      ...(popupState.baseLink ? { baseLink: popupState.baseLink } : {}),
    }));
  };
  const handleOpenCard = (links, bonus) => dispatch(addCardByLink({ links, bonus }));
  const handleAddItem = (itemName, itemType, number, link, opts) => dispatch(onAddInventoryItem(itemName, itemType, number, link, opts));

  const handleSort = column => {
    if (sortColumn === column) setSortDesc(v => !v);
    else { setSortColumn(column); setSortDesc(false); }
  };

  if (!player) {
    return (
      <div className="sh-stack" style={{ padding: 'var(--space-4)' }}>
        <EmptyState icon="backpack" title="No character selected" hint="Pick or create one from the sidebar." />
      </div>
    );
  }

  const itemCount = inventory.reduce((sum, it) => sum + (Number(it?.Number) || 1), 0);

  return (
    <div
      className="inventory-page-wrap"
      style={{
        width: '100%',
        /* boxSizing: padding adds to width 100% without this — that
           extra space would overflow the viewport horizontally. */
        boxSizing: 'border-box',
        /* No horizontal padding: each card carries its own 4% side margin
           via .card-width-spellbook (92% width centered). */
        paddingTop: 'var(--space-4)',
        paddingBottom: 'var(--space-12)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Title row uses the same .card-width-spellbook sizing as the cards
          below so the "Carry & equip" line + items pill horizontally align
          with the Equipment / Inventory cards (mobile 92%, desktop the
          spellbook-card calc width). Margin-bottom comes with the class. */}
      <div className="card-width-spellbook sh-row-h sh-spread" style={{ background: 'transparent', border: 0, boxShadow: 'none', marginBottom: 'var(--space-3)' }}>
        <div>
          <Filigree>Inventory</Filigree>
          <div className="sh-display" style={{ fontSize: 'var(--font-size-2xl)' }}>Carry & equip</div>
        </div>
        <Pill tone="accent">{itemCount} items</Pill>
      </div>

      <MoneyCard player={player} />

      <EquipmentCard
        equipment={equipment}
        equipmentCollapsed={combatPageCardsCollapsed.items}
        setEquipmentCollapsed={setter => {
          const newState = typeof setter === 'function' ? setter(combatPageCardsCollapsed.items) : setter;
          dispatch(setCombatPageCardCollapsed({ key: 'items', value: newState }));
        }}
        onUnequip={handleUnequipSlot}
        onOpenCard={handleOpenCard}
        player={player}
      />

      <CarryingCapacityCard
        player={player}
        collapsed={combatPageCardsCollapsed.carry}
        setCollapsed={(setter) => {
          const newState = typeof setter === 'function' ? setter(combatPageCardsCollapsed.carry) : setter;
          dispatch(setCombatPageCardCollapsed({ key: 'carry', value: newState }));
        }}
      />

      <Card
        className="card-width-spellbook card-overflow-visible"
        eyebrow="Inventory items"
        title={`${inventory.length} entries`}
        padding={false}
        action={
          <IconButton
            ghost size="sm"
            icon="add"
            onClick={() => setShowAddItemForm(true)}
            aria-label="Add item"
          />
        }
      >
        <table className="sh-inv-table">
          <InventoryTableHeader sortColumn={sortColumn} sortDesc={sortDesc} onSort={handleSort} />
          <tbody>
            {inventory.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState icon="inbox" title="No items yet" hint="Tap + above to add something." />
                </td>
              </tr>
            )}
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
        <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <Button
            block
            variant="primary"
            icon="add_shopping_cart"
            onClick={() => setShowAddItemForm(true)}
          >
            Add item
          </Button>
        </div>
      </Card>

      <AddItemFormInventory
        open={showAddItemForm}
        onAddItem={handleAddItem}
        items={allItems}
        onClose={() => setShowAddItemForm(false)}
      />

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
