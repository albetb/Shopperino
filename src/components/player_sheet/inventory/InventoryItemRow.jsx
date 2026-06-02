import formatItemName, { magicTypeFor, iconForItemType } from 'lib/item/formatItemName';

function itemBonus(item) {
  if (typeof item.bonus === 'number') return item.bonus;
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
  const magicType = magicTypeFor(item.ItemType, { bonus: item.bonus, effectIds: item.effectIds });
  const effectiveType = magicType || item.ItemType;
  const typeIcon = iconForItemType(effectiveType);
  const bonus = itemBonus(item);
  const baseName = item.overrides?.Name ?? item.Name;
  const displayName = formatItemName(baseName, {
    masterwork: item.masterwork,
    bonus: item.bonus,
    effectIds: item.effectIds,
  });

  const handleNameClick = () => {
    if (!item.Link) return;
    const links = Array.isArray(item.effectIds) && item.effectIds.length
      ? [item.Link, ...item.effectIds.map((id) => getEffectById(id)?.Link).filter(Boolean)]
      : item.Link;
    onOpenCard(links, bonus, {
      overrides: item.overrides || null,
      editKey: { kind: 'inventory', idx },
    });
  };

  return (
    <tr>
      <td className="align-right td-muted">{item.Number}</td>
      <td className="td-muted sh-inv-td--type" title={effectiveType}>
        <span className="material-symbols-outlined sh-inv-type-icon" aria-label={effectiveType}>
          {typeIcon}
        </span>
      </td>
      <td className="td-muted">
        {item.Link ? (
          <button type="button" className="button-link" onClick={handleNameClick}>
            {displayName}
          </button>
        ) : (
          displayName
        )}
      </td>
      <td className="td-action">
        <button
          type="button"
          className="flat-button smaller btn-cell-muted"
          onClick={(e) => onOptionsClick(e, item.Name, item.ItemType, item.Number, item.Link, {
            masterwork: !!item.masterwork,
            bonus: item.bonus || 0,
            effectIds: Array.isArray(item.effectIds) ? item.effectIds : [],
            baseLink: typeof item.baseLink === 'string' ? item.baseLink : '',
            overrides: item.overrides && typeof item.overrides === 'object' ? item.overrides : null,
          })}
          aria-label="Options"
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </td>
    </tr>
  );
}
