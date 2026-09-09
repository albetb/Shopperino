import { t } from '../../../lib/i18n';

const INVENTORY_COLUMNS = ['number', 'type', 'name'];

export default function InventoryTableHeader({ sortColumn, sortDesc, onSort }) {
  return (
    <thead>
      <tr className="sh-inv-head-row">
        {INVENTORY_COLUMNS.map((col) => {
          const label = col === 'number' ? '#' : col === 'name' ? t('Name') : '';
          const isActive = sortColumn === col;
          const thClass =
            col === 'number' ? 'sh-inv-th sh-inv-th--num' :
            col === 'name'   ? 'sh-inv-th sh-inv-th--name' :
                               'sh-inv-th sh-inv-th--type';
          return (
            <th
              key={col}
              className={`${thClass} ${isActive ? 'is-active' : ''}`}
              onClick={() => onSort(col)}
              aria-label={col === 'type' ? t('Sort by type') : undefined}
            >
              {label}
              {isActive && (
                <span className="sh-sort-arrow" aria-hidden="true">
                  {sortDesc ? ' ↓' : ' ↑'}
                </span>
              )}
            </th>
          );
        })}
        <th className="sh-inv-th sh-inv-th--action" aria-label={t('Actions')}></th>
      </tr>
    </thead>
  );
}
