import { useMemo } from 'react';

const COLUMNS = ['number', 'name', 'type', 'cost'];

/**
 * Returns items filtered (Number > 0) and sorted by the given column and direction.
 */
export function useSortedItems(items, sortColumn, sortDesc) {
  return useMemo(() => {
    const list = (items || []).filter((i) => (i.Number ?? 0) > 0);
    if (!sortColumn) return list;
    const mult = sortDesc ? 1 : -1;
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortColumn === 'number') cmp = (a.Number ?? 0) - (b.Number ?? 0);
      else if (sortColumn === 'name') cmp = (a.Name || '').localeCompare(b.Name || '');
      else if (sortColumn === 'type') cmp = (a.ItemType || '').localeCompare(b.ItemType || '');
      else if (sortColumn === 'cost') cmp = (parseFloat(a.Cost) || 0) - (parseFloat(b.Cost) || 0);
      return mult * cmp;
    });
  }, [items, sortColumn, sortDesc]);
}

export { COLUMNS };
