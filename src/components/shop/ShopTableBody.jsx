import { formatNumber } from 'lib/utils';
import ShopItemRow from './ShopItemRow';

export default function ShopTableBody({
  sortedItems,
  isViewOnly,
  deletingItems,
  onDeleteClick,
  longPressHandlers,
  onOpenCard,
  getEffectById,
}) {
  return (
    <tbody>
      {sortedItems.map((item, idx) => (
        <ShopItemRow
          key={`${item.Name}-${item.ItemType}-${idx}`}
          item={item}
          idx={idx}
          formatNumber={formatNumber}
          isViewOnly={isViewOnly}
          isDeleting={!!deletingItems[`${item.Name}-${item.ItemType}`]}
          onDeleteClick={onDeleteClick}
          longPressHandlers={longPressHandlers}
          onOpenCard={onOpenCard}
          getEffectById={getEffectById}
        />
      ))}
    </tbody>
  );
}
