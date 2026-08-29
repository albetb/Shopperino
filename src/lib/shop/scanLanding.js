/**
 * Where a scanned shop should land.
 *
 * A decision small enough to be tempting to leave inline in the scan handler,
 * and worth pulling out anyway: there is no button behind it — the shop simply
 * appears somewhere — so the routing *is* the feature, and a test that mirrored
 * the handler's own `if` would pass even with the handler deleted.
 *
 * The rule follows what the person is plainly doing. Scanning a code with your
 * own sheet in front of you means you are about to buy something, so the shop
 * opens right there as the drawer over the Inventory page. Scanning from
 * anywhere else opens the read-only list on the Shop tab, as it always has.
 */

/** Tab ids, from `tabPages` in App.jsx. */
const SHOP_TAB = 1;
const PLAYER_SHEET_TAB = 5;

/**
 * @param {{currentTab: number, hasCharacter: boolean}} where the app is now
 * @returns {{openOnSheet: boolean, goToTab: number|null}} `goToTab` is null
 *   when the shop opens where the reader already is.
 */
export function scanLanding({ currentTab, hasCharacter }) {
  /* No character means nothing to buy for, so the drawer would open onto an
     empty purse and an inventory belonging to nobody. */
  if (currentTab === PLAYER_SHEET_TAB && hasCharacter) {
    return { openOnSheet: true, goToTab: null };
  }
  return { openOnSheet: false, goToTab: SHOP_TAB };
}
