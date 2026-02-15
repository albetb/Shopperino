import { encodeShopPayloadToBase64Url, decodeShopPayloadFromBase64Url } from './shopParamsCodec';
import { generateShop } from './generateShop';
import Shop from './shop';
import { getLinkByShareRef, getShareFileCodeAndId } from './shareRef';
import { getItemByRef, getEffectIdBySlug, shopTypes } from '../utils';
import { unscaleGold, enumToStr } from '../storageFormat';

const SPECIFIC_TABLES = ['Specific Weapon', 'Specific Armor', 'Specific Shield'];

/**
 * Resolve the display link for a stock entry. Handles ref by link, ref by (fileCode, id), and full entries.
 */
function resolveStockEntryLink(entry) {
  if (entry.isCustom) return null;
  if (entry.fileCode != null && entry.id != null) {
    const link = getLinkByShareRef(entry.fileCode, entry.id);
    if (link) return link;
  }
  if (entry.link && typeof entry.link === 'string') {
    if (getItemByRef(entry.link)) return entry.link;
    const slug = entry.link.split('/').pop() || entry.link;
    for (const table of SPECIFIC_TABLES) {
      const link = `items/${table}/${slug}`;
      if (getItemByRef(link)) return link;
    }
    return entry.link;
  }
  const linkVal = entry.Link;
  if (typeof linkVal === 'string') {
    for (const table of SPECIFIC_TABLES) {
      const link = `items/${table}/${linkVal}`;
      if (getItemByRef(link)) return link;
    }
  }
  if (Array.isArray(linkVal) && linkVal.length > 0 && entry.BaseItemType) {
    return `items/${entry.BaseItemType}/${linkVal[0]}`;
  }
  return null;
}

/**
 * Convert serialized shop (from generateShop, which includes Stock) to shared format { name, gold, stock } for display.
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
      stock.push({
        Name: entry.Name ?? 'Unknown',
        Number: num,
        Cost: cost,
        isCustom: true,
        ItemType: entry.ItemType ?? 'Custom',
      });
    } else {
      const link = resolveStockEntryLink(entry);
      const o = { Number: num, Cost: cost };
      if (link) o.link = link;
      if (entry.Bonus != null) o.Bonus = entry.Bonus;
      if (Array.isArray(entry.effectIds) && entry.effectIds.length) {
        o.effectIds = entry.effectIds;
      } else if (Array.isArray(entry.Ability) && entry.Ability.length) {
        o.effectIds = entry.Ability
          .map(a => a && a.Link && getEffectIdBySlug(a.Link))
          .filter(id => id != null);
      }
      if (entry.Name) o.Name = entry.Name;
      stock.push(o);
    }
  }
  return {
    name: String(serialized.Name ?? ''),
    gold: s.Gold != null ? s.Gold : (Number(serialized.Gold) || 0),
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
  const shopTypeForPayload = serializedShop.GenShopType ?? serializedShop.ShopType;
  const shopTypeIndex = typeof shopTypeForPayload === 'number' ? shopTypeForPayload : types.indexOf(shopTypeForPayload);
  const params = {
    seed: (seed >>> 0),
    shopTypeIndex: shopTypeIndex >= 0 ? shopTypeIndex : 0,
    level: Math.max(0, Math.min(10, serializedShop.GenLevel ?? serializedShop.Level ?? 0)),
    cityLevel: Math.max(0, Math.min(5, serializedShop.GenCityLevel ?? serializedShop.CityLevel ?? 0)),
    playerLevel: Math.max(1, Math.min(99, serializedShop.GenPlayerLevel ?? serializedShop.PlayerLevel ?? 1)),
    reputation: Math.max(-10, Math.min(10, serializedShop.Reputation ?? 0)),
  };
  const additions = serializedShop.UserAdditions || [];
  const customItems = additions
    .filter(e => (Array.isArray(e) && e[0] === 1) || (e && e.custom))
    .map(e => Array.isArray(e) ? {
      name: String(e[1] ?? 'Custom'),
      number: Math.max(1, Math.min(99, (e[4] | 0) || 1)),
      price: unscaleGold(e[3]),
      type: enumToStr('CustomItemTypes', e[2]) || 'Good',
    } : {
      name: e.N ?? 'Custom',
      number: Math.max(1, Math.min(99, (e.n | 0) || 1)),
      price: typeof e.C === 'number' ? e.C : parseFloat(e.C) || 0,
      type: e.T ?? 'Custom',
    });
  const refItems = additions
    .filter(e => (Array.isArray(e) && e[0] === 0) || (e && !e.custom && (e.f != null || e.fileCode != null) && (e.i != null || e.id != null)))
    .map(e => Array.isArray(e) ? {
      fileCode: e[1],
      id: e[2],
      number: Math.max(1, Math.min(99, (e[3] | 0) || 1)),
      price: e[4] != null ? unscaleGold(e[4]) : 0,
      ...(e[5] != null ? { bonus: e[5] } : {}),
    } : {
      fileCode: e.f ?? e.fileCode,
      id: e.i ?? e.id,
      number: Math.max(1, Math.min(99, (e.n | 0) || 1)),
      price: typeof e.c === 'number' ? e.c : parseFloat(e.c) || 0,
      ...(e.b != null ? { bonus: e.b } : {}),
    });
  const soldList = Array.isArray(serializedShop.Sold) ? serializedShop.Sold : [];
  const soldItems = soldList.map(row => ({
    fileCode: row[0],
    id: row[1],
    numberSold: (row[2] | 0) || 0,
    ...(row.length >= 4 && row[3] != null ? { bonus: row[3] } : {}),
  })).filter(s => s.numberSold > 0);
  const rawGold = typeof serializedShop.Gold === 'number' ? unscaleGold(serializedShop.Gold) : (Number(serializedShop.Gold) || 0);
  const goldCents = Math.max(0, Math.round(rawGold * 100));
  const payload = encodeShopPayloadToBase64Url(params, customItems, refItems, soldItems, goldCents);
  return { ok: true, payload };
}

/** Get (fileCode, id) for a serialized stock entry (generated entries may have only link). */
function getStockEntryRef(entry) {
  if (!entry) return null;
  if (entry.fileCode != null && entry.id != null) return { fileCode: entry.fileCode, id: entry.id };
  if (entry.link && typeof entry.link === 'string') return getShareFileCodeAndId(entry.link);
  return null;
}

/**
 * Apply sold list to serialized Stock (same semantics as Shop.applySold): reduce generated ref entries, remove if Number <= 0.
 * @param {object[]} stock - serialized Stock array (mutated)
 * @param {{ fileCode: string; id: number; numberSold: number; bonus?: number }[]} soldItems
 */
function applySoldToStock(stock, soldItems) {
  if (!Array.isArray(stock) || !Array.isArray(soldItems)) return;
  for (const row of soldItems) {
    const fileCode = row.fileCode;
    const id = row.id;
    const numberSold = Math.max(0, (row.numberSold | 0) || 0);
    const bonus = row.bonus != null ? row.bonus : null;
    if (numberSold <= 0) continue;
    let remaining = numberSold;
    for (let i = stock.length - 1; i >= 0 && remaining > 0; i--) {
      const entry = stock[i];
      if (entry.userAdded || entry.isCustom) continue;
      const ref = getStockEntryRef(entry);
      if (!ref || ref.fileCode !== fileCode || ref.id !== id) continue;
      const entryBonus = entry.Bonus != null ? entry.Bonus : null;
      if (entryBonus !== bonus) continue;
      const n = entry.Number || 1;
      const deduct = Math.min(remaining, n);
      entry.Number = Math.max(0, n - deduct);
      remaining -= deduct;
      if (entry.Number <= 0) stock.splice(i, 1);
    }
  }
}

/**
 * Decode QR payload and regenerate shop. Returns { ok: true, shop: { name, gold, stock } } or { ok: false, error }.
 * Merges generated stock (from seed) with decoded custom/ref items, applies sold, and sets gold so receiver sees the same shop.
 */
export function parseSharedShop(encodedString) {
  if (!encodedString || typeof encodedString !== 'string') {
    return { ok: false, error: 'Invalid data' };
  }
  const decoded = decodeShopPayloadFromBase64Url(encodedString.trim());
  if (!decoded) return { ok: false, error: 'Invalid or corrupted data' };
  const { params, customItems, refItems = [], soldItems = [], goldCents = 0 } = decoded;
  const serialized = generateShop(params.seed, params);
  if (!serialized) return { ok: false, error: 'Could not generate shop' };
  serialized.Reputation = Math.max(-10, Math.min(10, params.reputation ?? 0));
  for (const c of customItems) {
    serialized.Stock.push({
      isCustom: true,
      Name: c.name,
      Number: c.number,
      Cost: c.price,
      ItemType: c.type ?? 'Custom',
    });
  }
  for (const r of refItems) {
    const link = getLinkByShareRef(r.fileCode, r.id);
    if (!link) continue;
    serialized.Stock.push({
      link,
      fileCode: r.fileCode,
      id: r.id,
      Number: r.number,
      PriceModifier: 0,
      ItemType: r.type ?? 'Good',
      CostOverride: r.price,
      userAdded: true,
    });
  }
  applySoldToStock(serialized.Stock, soldItems);
  if (goldCents > 0) serialized.Gold = goldCents / 100;
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
          ItemType: entry.ItemType ?? 'Custom',
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
          ItemType: entry.ItemType ?? 'Custom',
        });
      }
    } catch (_) {}
  }
  return result;
}
