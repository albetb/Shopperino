import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Shop from 'lib/shop';
import { sharedStockToDisplayItems } from 'lib/shop';
import { formatNumber, getEffectById } from 'lib/utils';
import { addCardByLink, clearSharedShop } from 'store/slices/appSlice';
import { updateShop } from 'store/slices/shopSlice';
import useLongPress from 'components/hooks/useLongPress';
import { useSortedItems } from './hooks/useSortedItems';
import { useShopLabels } from './hooks/useShopLabels';
import DeletePopup from './DeletePopup';
import ShopTableBody from './ShopTableBody';
import ShopTableHeader from './ShopTableHeader';
import 'style/shop_inventory.css';

const LONGPRESS_TIME = 400;

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
    position: { x: 0, y: 0 },
  });
  const [isLongPress, setIsLongPress] = useState(false);

  const sharedShop = useSelector((state) => state.app.sharedShop);
  const rawShop = useSelector((state) => state.shop.shop);
  const isViewOnly = !!sharedShop;
  const items = isViewOnly
    ? (Array.isArray(sharedShop.stock) ? sharedStockToDisplayItems(sharedShop.stock) : [])
    : (rawShop ? new Shop().load(rawShop).getInventory() : []);
  const shopName = isViewOnly ? (sharedShop.name ?? 'Shared shop') : (rawShop?.Name || '');
  const gold = isViewOnly ? (Number(sharedShop.gold) || 0) : (rawShop?.Gold ?? 0);
  const cityFromRedux = useSelector((state) => state.city.city?.Name) || '';
  const cityName = isViewOnly ? '' : cityFromRedux;

  const sortedItems = useSortedItems(items, sortColumn, sortDesc);
  const { shopLabel, cityLabel } = useShopLabels(shopName, cityName);
  const hasItems = items.some((i) => (i.Number ?? 0) > 0);

  const handleSort = (col) => {
    if (sortColumn === col) setSortDesc((d) => !d);
    else {
      setSortColumn(col);
      setSortDesc(col === 'name' || col === 'type');
    }
  };

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
    setDeletingItems((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      dispatch(updateShop(['sell', name, type, number]));
      setDeletingItems((prev) => {
        const np = { ...prev };
        delete np[key];
        return np;
      });
      setIsLongPress(false);
    }, LONGPRESS_TIME);
  };

  const handleAddItem = (name, type, cost, number, link) => {
    dispatch(updateShop(['buy', name, type, cost, number, link]));
    setShowAddItemForm(false);
  };

  const handleOpenCard = (links, bonus) => {
    dispatch(addCardByLink({ links, bonus }));
  };

  const longPressEvent = useLongPress(
    (_name, _type, number) => handleLongPressDelete(_name, _type, number),
    () => {},
    { shouldPreventDefault: true, delay: LONGPRESS_TIME }
  );

  return (
    <>
      <div className="header-container">
        <div className="label-container">
          <h2>{shopLabel()}</h2>
          <div className="space-left">
            {isViewOnly ? (
              <h4 className="view-only-italic">(view only)</h4>
            ) : (
              <h4>{cityLabel()}</h4>
            )}
          </div>
        </div>
        {(isViewOnly || hasItems) && (
          <div className={`money-box ${isViewOnly ? 'money-box-inline' : ''}`}>
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
        )}
      </div>

      {isViewOnly && !hasItems && <p className="empty-state-message">No items in this shop.</p>}
      {!isViewOnly && !hasItems && (
        <p className="search-hint">Create a world and shop, then generate its inventory.</p>
      )}

      <table
        className={`shop-table ${showAddItemForm ? 'shop-table-adding' : ''} ${hasItems ? '' : 'shop-table-empty'}`}
      >
        <ShopTableHeader sortColumn={sortColumn} sortDesc={sortDesc} onSort={handleSort} isViewOnly={isViewOnly} />
        <ShopTableBody
          sortedItems={sortedItems}
          items={items}
          isViewOnly={isViewOnly}
          showAddItemForm={showAddItemForm}
          hasItems={hasItems}
          deletingItems={deletingItems}
          onAddItem={handleAddItem}
          setShowAddItemForm={setShowAddItemForm}
          onDeleteClick={handleDeleteItemClick}
          longPressHandlers={longPressEvent}
          onOpenCard={handleOpenCard}
          getEffectById={getEffectById}
        />
      </table>

      {!isViewOnly && hasItems && !showAddItemForm && (
        <button className="add-item-button medium-long" onClick={() => setShowAddItemForm(true)}>
          Add Item
        </button>
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
