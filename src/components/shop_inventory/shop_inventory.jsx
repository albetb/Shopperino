import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Shop from '../../lib/shop';
import { sharedStockToDisplayItems } from '../../lib/shopShare';
import { isMobile, trimLine } from '../../lib/utils';
import { addCardByLink, clearSharedShop } from '../../store/slices/appSlice';
import { updateShop } from '../../store/slices/shopSlice';
import useLongPress from '../hooks/use_long_press';
import AddItemForm from './add_item_form';
import DeletePopup from './delete_popup';
import '../../style/shop_inventory.css';

export default function ShopInventory() {
  const dispatch = useDispatch();
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDesc, setSortDesc] = useState(true);
  const [deletingItems, setDeletingItems] = useState({});
  const [popup, setPopup] = useState({
    visible: false,
    itemName: '',
    itemType: '',
    itemNumber: 0,
    position: { x: 0, y: 0 }
  });
  const [isLongPress, setIsLongPress] = useState(false);
  const LONGPRESS_TIME = 400;

  // --- Redux selectors ---
  const sharedShop = useSelector(state => state.app.sharedShop);
  const rawShop = useSelector(state => state.shop.shop);
  const isViewOnly = !!sharedShop;
  const items = isViewOnly
    ? (Array.isArray(sharedShop.stock) ? sharedStockToDisplayItems(sharedShop.stock) : [])
    : (rawShop ? new Shop().load(rawShop).getInventory() : []);
  const shopName = isViewOnly ? (sharedShop.name ?? 'Shared shop') : (rawShop?.Name || '');
  const gold = isViewOnly ? (Number(sharedShop.gold) || 0) : (rawShop?.Gold ?? 0);
  const cityNameFromRedux = useSelector(state => state.city.city?.Name) || '';
  const cityName = isViewOnly ? '' : cityNameFromRedux;

  // --- Handlers ---
  const handleDeleteItemClick = (e, name, type, number) => {
    if (!isLongPress) {
      const pos = e.changedTouches?.length
        ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
        : { x: e.clientX, y: e.clientY };
      setPopup({ visible: true, itemName: name, itemType: type, itemNumber: number, position: pos });
    }
  };

  const handleLongPressDelete = (name, type, number) => {
    setIsLongPress(true);
    const key = `${name}-${type}`;
    setDeletingItems(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      dispatch(updateShop(['sell', name, type, number]));
      setDeletingItems(prev => { const np = { ...prev }; delete np[key]; return np; });
      setIsLongPress(false);
    }, LONGPRESS_TIME);
  };

  const handleAddItem = (name, type, cost, number, link) => {
    dispatch(updateShop(['buy', name, type, cost, number, link]));
    setShowAddItemForm(false);
  };

  const longPressEvent = useLongPress(
    (_name, _type, number) => handleLongPressDelete(_name, _type, number),
    () => { },
    { shouldPreventDefault: true, delay: LONGPRESS_TIME }
  );

  // don’t render if no items at all
  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDesc((d) => !d);
    } else {
      setSortColumn(col);
      setSortDesc(col === 'name' || col === 'type');
    }
  };

  const sortedItems = useMemo(() => {
    const list = items.filter((i) => i.Number > 0);
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

  const hasItems = items.some(i => (i.Number ?? 0) > 0);
  if (!hasItems && !isViewOnly) return null;

  const formatNumber = num => {
    const n = parseFloat(num);
    if (isNaN(n)) return '0';
    let [intPart, decPart] = n.toFixed(2).split('.');
    const sep = "'";
    const rev = intPart.split('').reverse().join('');
    const fmtInt = rev.match(/.{1,3}/g).join(sep).split('').reverse().join('');
    return `${fmtInt}.${decPart}`.replace('.00', '');
  };

  const shopLabel = () => trimLine(shopName, isMobile() ? 20 : 30);
  const cityLabel = () =>
    cityName
      ? `from ${trimLine(cityName, isMobile() ? 26 : 40)}`
      : '';

  return (
    <>
      <div className="header-container">
        <div className="label-container">
          <h2>{shopLabel()}</h2>
          <div className="space-left">
            {isViewOnly ? (
              <h4 style={{ fontStyle: 'italic' }}>Shared shop (view only)</h4>
            ) : (
              <h4>{cityLabel()}</h4>
            )}
          </div>
        </div>
        <div className="money-box" style={isViewOnly ? { display: 'flex', alignItems: 'center', gap: '0.5rem' } : undefined}>
          {isViewOnly && (
            <button
              type="button"
              className="modern-button small-middle"
              onClick={() => dispatch(clearSharedShop())}
            >
              Close
            </button>
          )}
          <h4><b>Gold: {formatNumber(gold)}</b></h4>
        </div>
      </div>

      {isViewOnly && !hasItems && (
        <p style={{ color: '#c0c0c0', margin: '1rem' }}>No items in this shop.</p>
      )}

      <table className={`shop-table ${showAddItemForm ? "shop-table-adding" : ""}`} style={hasItems ? undefined : { display: 'none' }}>
        <thead>
          <tr>
            {(['number', 'name', 'type', 'cost']).map((col) => {
              const label = col === 'number' ? '#' : col === 'name' ? 'Name' : col === 'type' ? 'Type' : 'Cost';
              const isActive = sortColumn === col;
              const thClass = col === 'number' ? 'number-size' : col === 'name' ? 'name-size' : col === 'type' ? 'type-size' : 'cost-size';
              return (
                <th
                  key={col}
                  className={`${thClass} sortable ${isActive ? 'sort-active' : ''}`}
                  style={{ color: '#c0c0c0', fontSize: '0.73em', cursor: 'pointer' }}
                  onClick={() => handleSort(col)}
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
        <tbody>
          {sortedItems.map((item, idx) => {
            const key = `${item.Name}-${item.ItemType}-${idx}`;
            const abbrevType = isMobile() && item.ItemType === 'Wondrous Item'
              ? 'W. Item'
              : item.ItemType;
            const itemBonus = item.Bonus != null && !isNaN(item.Bonus)
              ? item.Bonus
              : item.Name.includes("+")
                ? parseInt(item.Name.split("+")[1], 10)
                : item.Name.includes("perfect")
                  ? -1
                  : 0;

            return (
              <tr key={key} className={deletingItems[`${item.Name}-${item.ItemType}`] ? 'deleting' : ''}>
                <td className="align-right" style={{ color: "#c0c0c0", fontSize: "0.73em" }}>{item.Number}</td>
                <td style={{ color: "#c0c0c0", fontSize: "0.73em" }}>
                  {item.Link ? (
                    <button
                      type="button"
                      className="button-link"
                      color="#c0c0c0"
                      onClick={() => dispatch(addCardByLink({ links: item.Link, bonus: itemBonus }))}
                    >
                      {item.Name}
                    </button>
                  ) : (
                    item.Name
                  )}
                </td>
                <td style={{ color: "#c0c0c0", fontSize: "0.73em" }}>{abbrevType}</td>
                <td style={{ color: "#c0c0c0", fontSize: "0.73em" }}>{formatNumber(item.Cost)}</td>
                {!isViewOnly && (
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="flat-button smaller"
                      onClick={e => handleDeleteItemClick(e, item.Name, item.ItemType, item.Number)}
                      onMouseDown={e => longPressEvent.onMouseDown(e, [item.Name, item.ItemType, item.Number])}
                      onTouchStart={e => longPressEvent.onTouchStart(e, [item.Name, item.ItemType, item.Number])}
                      onMouseUp={longPressEvent.onMouseUp}
                      onMouseLeave={longPressEvent.onMouseLeave}
                      onTouchEnd={e => {
                        longPressEvent.onTouchEnd(e);
                        handleDeleteItemClick(e, item.Name, item.ItemType, item.Number);
                      }}
                      style={{ color: "#c0c0c0" }}
                    >
                      <span className="material-symbols-outlined">remove_shopping_cart</span>
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {!isViewOnly && (
        showAddItemForm ? (
          <AddItemForm onAddItem={handleAddItem} items={items} setShowAddItemForm={setShowAddItemForm} />
        ) : (
          <button className="add-item-button medium-long" onClick={() => setShowAddItemForm(true)}>Add Item</button>
        )
      )}

      {popup.visible && (
        <DeletePopup
          itemName={popup.itemName}
          itemType={popup.itemType}
          itemNumber={popup.itemNumber}
          position={popup.position}
          onClose={() => setPopup({ ...popup, visible: false })}
          onDelete={(itemName, itemType, num) => dispatch(updateShop(['sell', itemName, itemType, num]))}
        />
      )}
    </>
  );
}
