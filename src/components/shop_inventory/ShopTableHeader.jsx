import { COLUMNS } from './hooks/useSortedItems';

export default function ShopTableHeader({ sortColumn, sortDesc, onSort, isViewOnly }) {
  return (
    <thead>
      <tr>
        {COLUMNS.map((col) => {
          const label = col === 'number' ? '#' : col === 'name' ? 'Name' : col === 'type' ? 'Type' : 'Cost';
          const isActive = sortColumn === col;
          const thClass =
            col === 'number' ? 'number-size' : col === 'name' ? 'name-size' : col === 'type' ? 'type-size' : 'cost-size';
          return (
            <th
              key={col}
              className={`${thClass} sortable th-sortable-muted ${isActive ? 'sort-active' : ''}`}
              onClick={() => onSort(col)}
            >
              {label}
              {isActive && (
                <span className="sort-arrow" aria-hidden="true">
                  {sortDesc ? ' ↓' : ' ↑'}
                </span>
              )}
            </th>
          );
        })}
        {!isViewOnly && <th className="action-size"></th>}
      </tr>
    </thead>
  );
}
