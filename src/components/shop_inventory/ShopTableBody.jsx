import { formatNumber } from '../../lib/utils';
import AddItemForm from './add_item_form';
import ShopItemRow from './ShopItemRow';

export default function ShopTableBody({
  sortedItems,
  items,
  isViewOnly,
  showAddItemForm,
  hasItems,
  deletingItems,
  onAddItem,
  setShowAddItemForm,
  onDeleteClick,
  longPressHandlers,
  onOpenCard,
  getEffectById,
}) {
  const formatNum = formatNumber;

  return (
    <tbody>
      {sortedItems.map((item, idx) => (
        <ShopItemRow
          key={`${item.Name}-${item.ItemType}-${idx}`}
          item={item}
          idx={idx}
          formatNumber={formatNum}
          isViewOnly={isViewOnly}
          isDeleting={!!deletingItems[`${item.Name}-${item.ItemType}`]}
          onDeleteClick={onDeleteClick}
          longPressHandlers={longPressHandlers}
          onOpenCard={onOpenCard}
          getEffectById={getEffectById}
        />
      ))}
      {!isViewOnly && hasItems && showAddItemForm && (
        <AddItemForm
          onAddItem={onAddItem}
          items={items}
          setShowAddItemForm={setShowAddItemForm}
        />
      )}
    </tbody>
  );
}
