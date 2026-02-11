import { encodeShopPayloadToBase64Url, decodeShopPayloadFromBase64Url } from './shopParamsCodec';
import { generateShop } from './generateShop';
import Shop from './shop';
import { getItemByRef, shopTypes } from './utils';

/**
 * Convert serialized shop (from generateShop) to shared format { name, gold, stock } for display.
 */
function serializedShopToSharedFormat(serialized) {
  if (!serialized || !Array.isArray(serialized.Stock)) return { name: '', gold: 0, stock: [] };
  const s = new Shop().load(serialized);
  const inv = s.getInventory();
  const stock = [];
  for (let i = 0; i < serialized.Stock.length; i++) {
    const entry = serialized.Stock[i];
    const item = inv[i];
    if (!item) continue;
    const cost = item.Cost;
    const num = entry.Number ?? 1;
    if (entry.isCustom) {
      stock.push({ Name: entry.Name ?? 'Unknown', Number: num, Cost: cost, isCustom: true });
    } else {
      const o = { link: entry.link, Number: num, Cost: cost };
      if (entry.Bonus != null) o.Bonus = entry.Bonus;
      if (Array.isArray(entry.effectIds) && entry.effectIds.length) o.effectIds = entry.effectIds;
      if (entry.Name) o.Name = entry.Name;
      stock.push(o);
    }
  }
  return {
    name: String(serialized.Name ?? ''),
    gold: Number(serialized.Gold) || 0,
    stock,
  };
}

/**
 * Encode shop for QR share (seed + params + custom items). Returns { ok: true, payload: base64UrlString } or { ok: false, error }.
 * Generated items come from seed; custom items (isCustom) are encoded losslessly (name, number, price).
 */
export function compressShopForShare(serializedShop) {
  if (!serializedShop) return { ok: false, error: 'No shop to share' };
  const seed = serializedShop.Seed;
  if (seed == null) return { ok: false, error: 'Regenerate the shop to share it (seed is required).' };
  const types = shopTypes();
  const shopTypeIndex = types.indexOf(serializedShop.ShopType);
  const params = {
    seed: (seed >>> 0),
    shopTypeIndex: shopTypeIndex >= 0 ? shopTypeIndex : 0,
    level: Math.max(0, Math.min(10, serializedShop.Level ?? 0)),
    cityLevel: Math.max(0, Math.min(5, serializedShop.CityLevel ?? 0)),
    playerLevel: Math.max(1, Math.min(99, serializedShop.PlayerLevel ?? 1)),
  };
  const customItems = (serializedShop.Stock || [])
    .filter(e => e && e.isCustom)
    .map(e => ({
      name: e.Name ?? 'Custom',
      number: Math.max(1, Math.min(99, (e.Number | 0) || 1)),
      price: parseFloat(e.Cost) || 0,
    }));
  const payload = encodeShopPayloadToBase64Url(params, customItems);
  return { ok: true, payload };
}

/**
 * Decode QR payload and regenerate shop. Returns { ok: true, shop: { name, gold, stock } } or { ok: false, error }.
 * Merges generated stock (from seed) with decoded custom items.
 */
export function parseSharedShop(encodedString) {
  if (!encodedString || typeof encodedString !== 'string') {
    return { ok: false, error: 'Invalid data' };
  }
  const decoded = decodeShopPayloadFromBase64Url(encodedString.trim());
  if (!decoded) return { ok: false, error: 'Invalid or corrupted data' };
  const { params, customItems } = decoded;
  const serialized = generateShop(params.seed, params);
  if (!serialized) return { ok: false, error: 'Could not generate shop' };
  for (const c of customItems) {
    serialized.Stock.push({
      isCustom: true,
      Name: c.name,
      Number: c.number,
      Cost: c.price,
    });
  }
  const shop = serializedShopToSharedFormat(serialized);
  return {
    ok: true,
    shop: {
      name: String(shop.name),
      gold: shop.gold,
      stock: shop.stock,
    },
  };
}

/**
 * Turn shared shop stock into display items: [{ Name, Number, Cost, Link?, Bonus?, ItemType?, effectIds? }].
 */
export function sharedStockToDisplayItems(stock) {
  if (!Array.isArray(stock)) return [];
  const result = [];
  for (let i = 0; i < stock.length; i++) {
    try {
      const entry = stock[i];
      if (!entry || typeof entry !== 'object') continue;
      const num = entry.Number ?? 1;
      const cost = entry.Cost ?? 0;
      if (!(num > 0)) continue;
      if (entry.isCustom) {
        result.push({
          Name: entry.Name ?? 'Unknown',
          Number: num,
          Cost: cost,
          ItemType: 'Custom',
        });
        continue;
      }
      if (entry.link && typeof entry.link === 'string') {
        let ref = null;
        try {
          ref = getItemByRef(entry.link);
        } catch (_) {}
        const base = ref?.raw;
        const bonus = entry.Bonus != null && !isNaN(entry.Bonus) ? entry.Bonus : null;
        const resolvedName = base
          ? (bonus != null ? `${base.Name} +${bonus}` : base.Name)
          : entry.link;
        const name = (entry.Name && String(entry.Name).trim()) ? entry.Name : resolvedName;
        const parts = entry.link.split('/');
        const itemType = parts.length >= 2 ? parts[1] : 'Item';
        const display = {
          Name: name,
          Number: num,
          Cost: cost,
          Link: entry.link,
          ItemType: itemType,
        };
        if (bonus != null) display.Bonus = bonus;
        if (Array.isArray(entry.effectIds) && entry.effectIds.length) display.effectIds = entry.effectIds;
        result.push(display);
      } else {
        result.push({
          Name: entry.Name ?? 'Unknown',
          Number: num,
          Cost: cost,
          ItemType: 'Custom',
        });
      }
    } catch (_) {}
  }
  return result;
}
