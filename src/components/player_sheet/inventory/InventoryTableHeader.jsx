const INVENTORY_COLUMNS = ['number', 'name', 'type'];

export default function InventoryTableHeader({ sortColumn, sortDesc, onSort }) {
  return (
    <thead>
      <tr>
        {INVENTORY_COLUMNS.map((col) => {
          const label = col === 'number' ? '#' : col === 'name' ? 'Name' : 'Type';
          const isActive = sortColumn === col;
          const thClass =
            col === 'number' ? 'align-right' : col === 'name' ? 'name-size' : 'type-size';
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
        <th className="action-size"></th>
      </tr>
    </thead>
  );
}
