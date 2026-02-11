/**
 * Deterministic shop generation from seed and parameters.
 * Used for QR share: transmit only (seed, params); receiver regenerates the same shop.
 */
import { createPrng } from './prng';
import { loadFile } from './loadFile';
import Shop from './shop';

/**
 * Generate a shop deterministically from seed and parameters.
 * Returns the serialized shop (plain object) suitable for display or storage.
 * Id is set to a deterministic value so it does not depend on newGuid().
 *
 * @param {number} seed - 32-bit unsigned seed
 * @param {{ shopTypeIndex: number, level: number, cityLevel: number, playerLevel: number, name?: string }} params
 * @returns {object|null} - Serialized shop (Id, Name, Level, CityLevel, PlayerLevel, Reputation, Stock, Gold, Time, ArcaneChance, ShopType, ItemModifier) or null if invalid
 */
export function generateShop(seed, params) {
  const tables = loadFile('tables');
  const shopTypes = tables && tables['Shop Types'];
  if (!Array.isArray(shopTypes) || shopTypes.length === 0) return null;

  const shopTypeIndex = Math.max(0, Math.min((params.shopTypeIndex | 0), shopTypes.length - 1));
  const level = Math.max(0, Math.min(10, params.level | 0));
  const cityLevel = Math.max(0, Math.min(5, params.cityLevel | 0));
  const playerLevel = Math.max(1, Math.min(99, params.playerLevel | 0));
  const shopType = shopTypes[shopTypeIndex];
  const shopTypeName = shopType ? shopType.Name : 'None';

  const prng = createPrng(seed >>> 0);
  const shop = new Shop('', cityLevel, playerLevel);
  shop.Level = level;
  shop.ShopType = shopTypeName;
  shop.template();
  shop.Id = 'shared-' + (seed >>> 0);
  shop.Name = (params.name != null && String(params.name).trim() !== '') ? String(params.name).trim() : shopTypeName;
  shop.generateInventory(prng);

  return shop.serialize();
}
