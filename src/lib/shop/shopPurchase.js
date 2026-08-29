/**
 * Buying a row out of a scanned shop.
 *
 * The arithmetic lives here rather than in the drawer that shows it, per the
 * project rule that a component displays and a model computes. There is more
 * of it than "price times quantity" suggests, because of one fact about the
 * purse: `Player.setGold` clamps at zero, so a character's gold cannot go
 * negative. "Rules are computed and never enforced" therefore cannot be
 * honoured here by letting the purse run below zero — it has to be honoured by
 * letting the purchase through and *saying* what it costs.
 */

const round2 = (n) => Number((Number(n) || 0).toFixed(2));

/**
 * What one of this row costs the buyer.
 *
 * Already the party-facing price: the shared payload runs its stock through
 * `Shop.getInventory()` before encoding, so reputation and the city modifier
 * are baked in. Nothing here re-applies them.
 */
export function unitPrice(item) {
  return round2(item?.Cost ?? 0);
}

/** How many of this row the scanned snapshot still shows. */
export function availableOf(item) {
  return Math.max(0, Math.floor(Number(item?.Number) || 0));
}

/**
 * The quantity actually buyable, clamped to what the shop lists.
 *
 * This is not a rule being enforced — it is a shop having two of something.
 * The non-enforcement convention is about D&D's limits, not about inventing
 * stock that the master's code never claimed to hold.
 */
export function clampQuantity(item, quantity) {
  const available = availableOf(item);
  const asked = Math.floor(Number(quantity) || 0);
  return Math.max(1, Math.min(Math.max(1, available), asked));
}

/** The number the price box opens with, before the table haggles over it. */
export function askingPrice(item, quantity) {
  return round2(unitPrice(item) * clampQuantity(item, quantity));
}

/**
 * What paying `price` does to a purse holding `gold`.
 *
 * `shortfall` is the whole point: it is what the drawer shows instead of
 * disabling the button, and it is non-zero exactly when the purse will floor
 * at zero rather than hold the true balance.
 */
export function purchaseCost(gold, price) {
  const have = round2(Math.max(0, Number(gold) || 0));
  const owed = round2(Math.max(0, Number(price) || 0));
  return {
    have,
    owed,
    shortfall: round2(Math.max(0, owed - have)),
    remaining: round2(Math.max(0, have - owed)),
  };
}

/**
 * The arguments `onAddInventoryItem(name, type, number, link, opts)` wants for
 * this row.
 *
 * `bonus` and `effectIds` are carried so a +1 flaming longsword arrives as
 * one. `masterwork` is not: the share codec has no field for it, so a shared
 * shop cannot describe a masterwork item in the first place and inventing the
 * flag here would be worse than dropping it.
 */
export function inventoryArgsFor(item, quantity) {
  const number = clampQuantity(item, quantity);
  const opts = {};
  if (item?.Bonus != null && !Number.isNaN(Number(item.Bonus))) opts.bonus = Number(item.Bonus);
  if (Array.isArray(item?.effectIds) && item.effectIds.length) opts.effectIds = item.effectIds;
  return {
    name: item?.Name ?? 'Unknown',
    type: item?.ItemType || 'Item',
    number,
    link: item?.Link || '',
    opts,
  };
}
