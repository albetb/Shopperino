/**
 * Shop pricing: true cost formula and rounding rules.
 * Single place to tweak prices without touching CRUD or simulation.
 */

/**
 * Compute the effective cost of an item for a party (buy) or for the shop (sell).
 * @param {object} item - Resolved item with Cost, PriceModifier, Number
 * @param {boolean} forParty - If true, reputation discount applies (buying); otherwise shop view (selling)
 * @param {number} reputation - Shop reputation (-10..10)
 * @param {number} cityLevel - City level (0..5)
 * @returns {number} Rounded cost (e.g. 0.01, 1, 5, 10)
 */
export function computeTrueCost(item, forParty = true, reputation = 0, cityLevel = 0) {
  if (!item) return 0;
  const rep = forParty ? reputation * 2 : 0;
  const mod = (100 + (item.PriceModifier ?? 0) - rep + cityLevel) / 100;
  let cost = Math.max((parseFloat(item.Cost) || 0) * mod, 0.01);
  const dec = cost < 100 ? 1 : cost < 1000 ? 5 : 10;
  return parseFloat(cost < 1 ? cost.toFixed(2) : Math.round(cost / dec) * dec);
}
