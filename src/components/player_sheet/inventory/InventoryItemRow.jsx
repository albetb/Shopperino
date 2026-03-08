import { isMobile } from 'lib/utils';

function itemBonus(item) {
  if (item.Bonus != null && !isNaN(item.Bonus)) return item.Bonus;
  if (item.Name && item.Name.includes('+')) return parseInt(item.Name.split('+')[1], 10);
  if (item.Name && item.Name.includes('perfect')) return -1;
  return 0;
}

export default function InventoryItemRow({
  item,
  idx,
  onOptionsClick,
  onOpenCard,
  getEffectById,
}) {
  const abbrevType = isMobile() && item.ItemType === 'Wondrous Item' ? 'W. Item' : item.ItemType;
  const bonus = itemBonus(item);

  const handleNameClick = () => {
    if (!item.Link) return;
    const links = Array.isArray(item.effectIds) && item.effectIds.length
      ? [item.Link, ...item.effectIds.map((id) => getEffectById(id)?.Link).filter(Boolean)]
      : item.Link;
    onOpenCard(links, bonus);
  };

  return (
    <tr>
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
      <td className="td-action">
        <button
          type="button"
          className="flat-button smaller btn-cell-muted"
          onClick={(e) => onOptionsClick(e, item.Name, item.ItemType, item.Number, item.Link)}
          aria-label="Options"
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </td>
    </tr>
  );
}
