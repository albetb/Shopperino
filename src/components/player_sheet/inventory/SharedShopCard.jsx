import { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { addCardByLink, clearSharedShop, setSharedShopSheetOpen } from '../../../store/slices/appSlice';
import { onBuyFromSharedShop } from '../../../store/thunks/playerSheetThunks';
import { getEffectById } from '../../../lib/utils';
import {
  sharedStockToDisplayItems,
  unitPrice,
  availableOf,
  clampQuantity,
  askingPrice,
  purchaseCost,
} from '../../../lib/shop';
import Card from '../../common/Card';
import Button from '../../common/Button';
import IconButton from '../../common/IconButton';
import Icon from '../../common/Icon';
import Pill from '../../common/Pill';
import Stepper from '../../common/Stepper';
import EmptyState from '../../common/EmptyState';
import BottomSheet from '../../common/BottomSheet';
import '../../../style/shared_shop.css';

/* The purse and the prices are the same coin, so they are formatted the way
   MoneyCard formats it: whole gold drops the decimals, a part-coin keeps both,
   because the trailing zero in 1.50 is five silver rather than nothing. */
const formatGp = (value) => {
  const fixed = (Math.max(0, Number(value) || 0)).toFixed(2);
  return fixed.endsWith('.00') ? fixed.slice(0, -3) : fixed;
};

/**
 * One row of the scanned shop, and the haggle that buys it.
 *
 * The row expands in place rather than opening a popover over the drawer: this
 * is already inside a bottom sheet, and a second layer above it is a thing to
 * dismiss twice on a phone.
 *
 * The price is editable and defaults to the asking price, which is the point
 * of the box — a master gives a discount, charges over the odds for the last
 * healing potion, or the party haggles. The edited number is what leaves the
 * purse.
 */
function ShopRow({ item, gold, onBuy, onOpenCard }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');

  const available = availableOf(item);
  const asking = askingPrice(item, quantity);
  const paying = price === '' ? asking : Math.max(0, Number(price) || 0);
  const { shortfall, remaining } = purchaseCost(gold, paying);

  const setQuantityAndPrice = (next) => {
    const n = clampQuantity(item, next);
    setQuantity(n);
    /* Retyping the price is a decision about *this* purchase, so changing the
       count does not silently undo it. Left alone, the box keeps tracking the
       asking price. */
    if (price !== '') setPrice(String(askingPrice(item, n)));
  };

  const confirm = () => {
    onBuy(item, quantity, paying);
    setOpen(false);
    setQuantity(1);
    setPrice('');
  };

  return (
    <li className={'shared-shop-row' + (open ? ' is-open' : '')}>
      <div className="shared-shop-row-line">
        <button
          type="button"
          className="shared-shop-row-head"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="shared-shop-row-name">
            {item.Name}
            <span className="shared-shop-row-type">{item.ItemType}</span>
          </span>
          <span className="shared-shop-row-right">
            <span className="shared-shop-row-left-count">{available} left</span>
            <span className="shared-shop-row-price">{formatGp(unitPrice(item))} g</span>
            <Icon name={open ? 'expand_less' : 'add_shopping_cart'} size={18} />
          </span>
        </button>
        {/* Buying blind is the thing to avoid: a scanned row is a name and a
            price, and what the item actually does lives in the info sidebar the
            rest of the app already opens. Only rows that resolve to a real item
            get one — a master's hand-written row has nothing to show. */}
        {item.Link && (
          <IconButton
            ghost
            size="sm"
            icon="info"
            className="shared-shop-row-info"
            onClick={() => onOpenCard(item)}
            aria-label={`What is ${item.Name}?`}
          />
        )}
      </div>

      {open && (
        <div className="shared-shop-buy">
          <div className="shared-shop-buy-controls">
            <span className="shared-shop-field">
              <span className="shared-shop-field-label">How many</span>
              <Stepper
                value={quantity}
                min={1}
                max={Math.max(1, available)}
                onChange={setQuantityAndPrice}
              />
            </span>
            <label className="shared-shop-field">
              <span className="shared-shop-field-label">Price</span>
              <input
                type="number"
                className="modern-input shared-shop-price-input"
                inputMode="decimal"
                min={0}
                step={0.01}
                value={price === '' ? asking : price}
                onChange={(e) => setPrice(e.target.value)}
                aria-label={`Price for ${item.Name}`}
              />
            </label>
          </div>

          <p className="shared-shop-buy-note">
            {shortfall > 0 ? (
              <span className="is-short">
                That is <b>{formatGp(shortfall)} g</b> more than you carry. Buying
                it empties the purse — the rest is owed at the table.
              </span>
            ) : (
              <>Leaves you <b>{formatGp(remaining)} g</b>.</>
            )}
          </p>

          <Button block variant="primary" icon="shopping_bag" onClick={confirm}>
            Buy for {formatGp(paying)} g
          </Button>
        </div>
      )}
    </li>
  );
}

ShopRow.propTypes = {
  item: PropTypes.object.isRequired,
  gold: PropTypes.number.isRequired,
  onBuy: PropTypes.func.isRequired,
  onOpenCard: PropTypes.func.isRequired,
};

/**
 * The scanned shop, on the character sheet.
 *
 * A scanned shop used to be a list you could read and nothing else, on a tab
 * away from the purse and the bags that any purchase concerns. This card sits
 * on the Inventory page while a shop is held — beside the money and the
 * carrying capacity, which is where buying belongs — and it doubles as the
 * only visible sign that a shop is being held at all.
 */
export default function SharedShopCard({ player }) {
  const dispatch = useDispatch();
  const sharedShop = useSelector((state) => state.app.sharedShop);
  /* In the store rather than local state so a scan can open it: scanning a code
     with this sheet already in front of you puts the shop here directly. */
  const open = useSelector((state) => state.app.sharedShopSheetOpen);
  const setOpen = (value) => dispatch(setSharedShopSheetOpen(value));

  if (!sharedShop || !player) return null;

  const items = sharedStockToDisplayItems(sharedShop.stock).filter((i) => availableOf(i) > 0);
  const gold = player.getGold?.() ?? 0;
  const name = sharedShop.name || 'Shared shop';

  const close = () => {
    setOpen(false);
    dispatch(clearSharedShop());
  };

  /* The same card the rest of the app opens for an item. Named effects travel
     as extra links rather than as ids — that is what `addCardByLink` reads, and
     it is how ShopItemRow already does it — so a +1 flaming longsword opens as
     the sword and the flame rather than as a plain longsword. */
  const openCard = (item) => {
    const effectLinks = (Array.isArray(item.effectIds) ? item.effectIds : [])
      .map((id) => getEffectById(id)?.Link)
      .filter(Boolean);
    dispatch(addCardByLink({
      links: effectLinks.length ? [item.Link, ...effectLinks] : item.Link,
      bonus: item.Bonus || 0,
    }));
  };

  return (
    <>
      <Card
        className="card-width-spellbook shared-shop-card"
        eyebrow="Scanned shop"
        title={name}
        action={
          <IconButton
            ghost size="sm"
            icon="close"
            onClick={close}
            aria-label="Put this shop down"
            title="Put this shop down"
          />
        }
      >
        <div className="shared-shop-summary">
          <Pill tone="ghost" icon="inventory_2">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Pill>
          <Button
            variant="primary"
            icon="storefront"
            onClick={() => setOpen(true)}
            disabled={items.length === 0}
          >
            Browse and buy
          </Button>
        </div>
      </Card>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Scanned shop"
        title={name}
        fixedHeight
        subheader={
          <div className="shared-shop-purse">
            <Icon name="paid" size={18} color="var(--coin-gold)" />
            <b>{formatGp(gold)} g</b>
            <span className="shared-shop-purse-label">in the purse</span>
          </div>
        }
      >
        {items.length === 0 ? (
          <EmptyState icon="inventory_2" title="Nothing left" hint="You have bought out this shop." />
        ) : (
          <ul className="shared-shop-list">
            {items.map((item) => (
              <ShopRow
                key={item.stockIndex}
                item={item}
                gold={gold}
                onBuy={(...args) => dispatch(onBuyFromSharedShop(...args))}
                onOpenCard={openCard}
              />
            ))}
          </ul>
        )}
      </BottomSheet>
    </>
  );
}

SharedShopCard.propTypes = {
  player: PropTypes.object,
};
