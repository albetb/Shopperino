/**
 * Shop time simulation: passing time and per-hour effects.
 * Keeps simulation rules separate from core CRUD (buy/sell) and pricing.
 */

const MAX_SIMULATED_HOURS = 7 * 24; // 1 week cap for performance

/**
 * Advance the shop by one simulated hour: update time, gold, maybe sell/restock.
 * @param {import('./shop').default} shop - Shop instance (mutated)
 */
export function runOneHour(shop) {
  shop.Time++;
  if (!shop.Stock || shop.Stock.length === 0) return;

  // Invest some gold and gain levels
  if (shop.Gold > shop.baseGold(shop.PlayerLevel, shop.Level)) {
    shop.setGold(shop.Gold * 0.9);
    shop.setShopLevel(shop.Level + 0.01 * (10 - parseInt(shop.Level)));
  }
  // Spend a little amount of gold per day
  shop.setGold(shop.Gold - (shop.Time % 3 === 0 ? 1 : 0));
  shop.sellSomething();
  if (shop.Time % 24 === 0) {
    shop.reStock();
  }
}

/**
 * Simulate passing time (hours and days). Updates shop in place.
 * @param {import('./shop').default} shop - Shop instance (mutated)
 * @param {number} hours
 * @param {number} days
 */
export function passingTime(shop, hours = 0, days = 0) {
  const totalHours = Math.min(hours + days * 24, MAX_SIMULATED_HOURS);
  for (let i = 0; i < totalHours; i++) {
    runOneHour(shop);
  }
  shop.sortByType();
}
