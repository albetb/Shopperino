import { isMobile } from '../../lib/utils';

function itemBonus(item) {
  if (item.Bonus != null && !isNaN(item.Bonus)) return item.Bonus;
  if (item.Name && item.Name.includes('+')) return parseInt(item.Name.split('+')[1], 10);
  if (item.Name && item.Name.includes('perfect')) return -1;
  return 0;
}

export default function ShopItemRow({
  item,
  idx,
  formatNumber: formatNum,
  isViewOnly,
  isDeleting,
  onDeleteClick,
  longPressHandlers,
  onOpenCard,
  getEffectById,
}) {
  const abbrevType = isMobile() && item.ItemType === 'Wondrous Item' ? 'W. Item' : item.ItemType;
  const bonus = itemBonus(item);

  const handleNameClick = () => {
    const links = Array.isArray(item.effectIds) && item.effectIds.length
      ? [item.Link, ...item.effectIds.map((id) => getEffectById(id)?.Link).filter(Boolean)]
      : item.Link;
    onOpenCard(links, bonus);
  };

  return (
    <tr className={isDeleting ? 'deleting' : ''}>
      <td className="align-right td-muted">{item.Number}</td>
      <td className="td-muted">
        {item.Link ? (
          <button type="button" className="button-link" onClick={handleNameClick}>
            {item.Name}
          </button>
        ) : (
          item.Name
        )}
      </td>
      <td className="td-muted">{abbrevType}</td>
      <td className="td-muted">{formatNum(item.Cost)}</td>
      {!isViewOnly && (
        <td className="td-action">
          <button
            className="flat-button smaller btn-cell-muted"
            onClick={(e) => onDeleteClick(e, item.Name, item.ItemType, item.Number)}
            onMouseDown={(e) => longPressHandlers.onMouseDown(e, [item.Name, item.ItemType, item.Number])}
            onTouchStart={(e) => longPressHandlers.onTouchStart(e, [item.Name, item.ItemType, item.Number])}
            onMouseUp={longPressHandlers.onMouseUp}
            onMouseLeave={longPressHandlers.onMouseLeave}
            onTouchEnd={(e) => {
              longPressHandlers.onTouchEnd(e);
              onDeleteClick(e, item.Name, item.ItemType, item.Number);
            }}
          >
            <span className="material-symbols-outlined">remove_shopping_cart</span>
          </button>
        </td>
      )}
    </tr>
  );
}
