import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import Shop from './shop';
import { getItemByRef } from './utils';

/** Max length of compressed string for QR code (fits in medium-sized QR). */
export const SHARE_QR_MAX_CHARS = 2500;

/** Build minimal share payload from serialized shop: { n, g, s } with short keys. */
function buildSharePayload(serializedShop) {
  if (!serializedShop || !Array.isArray(serializedShop.Stock)) return null;
  const shop = new Shop().load(serializedShop);
  const inventory = shop.getInventory();
  if (!inventory.length) return null;

  const s = inventory
    .filter(item => item && (item.Number ?? 0) > 0)
    .map(item => {
      const totalPrice = (parseFloat(item.Cost) || 0) * (item.Number ?? 1);
      const p = Math.round(totalPrice * 100) / 100;
      if (item.Link) {
        const entry = { l: item.Link, N: item.Number, p };
        if (item.Bonus != null && !isNaN(item.Bonus)) entry.b = item.Bonus;
        return entry;
      }
      return { n: item.Name, N: item.Number, p };
    });

  return {
    n: serializedShop.Name || '',
    g: serializedShop.Gold ?? 0,
    s,
  };
}

/**
 * Compress shop for sharing. Returns { ok: true, payload: encodedString } or { ok: false, error: '...' }.
 */
export function compressShopForShare(serializedShop) {
  const payload = buildSharePayload(serializedShop);
  if (!payload) return { ok: false, error: 'Shop has no items' };
  const json = JSON.stringify(payload);
  const compressed = compressToEncodedURIComponent(json);
  if (compressed.length > SHARE_QR_MAX_CHARS) {
    return { ok: false, error: 'Shop is too large and cannot be shared via QR code.' };
  }
  return { ok: true, payload: compressed };
}

/**
 * Parse and validate shared shop string. Returns { ok: true, shop: { name, gold, stock } } or { ok: false, error }.
 * stock entries: for refs { link, Number, Cost (per unit), Bonus? }, for custom { Name, Number, Cost }.
 */
export function parseSharedShop(encodedString) {
  if (!encodedString || typeof encodedString !== 'string') {
    return { ok: false, error: 'Invalid data' };
  }
  let json;
  try {
    const decompressed = decompressFromEncodedURIComponent(encodedString.trim());
    if (!decompressed) return { ok: false, error: 'Invalid or corrupted data' };
    json = JSON.parse(decompressed);
  } catch (e) {
    return { ok: false, error: 'Invalid or corrupted data' };
  }
  if (!json || typeof json !== 'object') return { ok: false, error: 'Invalid data' };
  const name = json.n ?? json.name ?? '';
  const gold = typeof json.g === 'number' ? json.g : (typeof json.gold === 'number' ? json.gold : 0);
  const rawStock = json.s ?? json.stock;
  if (!Array.isArray(rawStock)) return { ok: false, error: 'Invalid shop data' };

  const stock = rawStock.map(entry => {
    if (!entry || typeof entry !== 'object') return null;
    const N = entry.N ?? entry.Number ?? 1;
    const p = typeof entry.p === 'number' ? entry.p : (parseFloat(entry.price) || 0);
    const costPerUnit = N > 0 ? p / N : 0;
    if (entry.l ?? entry.link) {
      const link = entry.l ?? entry.link;
      const b = entry.b ?? entry.Bonus;
      return {
        link,
        Number: N,
        Cost: costPerUnit,
        ...(b != null && !isNaN(b) ? { Bonus: typeof b === 'number' ? b : parseInt(b, 10) } : {}),
      };
    }
    const n = entry.n ?? entry.Name ?? '';
    return { Name: n, Number: N, Cost: costPerUnit, isCustom: true };
  }).filter(Boolean);

  return {
    ok: true,
    shop: {
      name: String(name),
      gold,
      stock,
    },
  };
}

/**
 * Turn shared shop stock into display items: [{ Name, Number, Cost, Link?, Bonus?, ItemType? }].
 */
export function sharedStockToDisplayItems(stock) {
  if (!Array.isArray(stock)) return [];
  return stock.map(entry => {
    const Number = entry.Number ?? 1;
    const Cost = entry.Cost ?? 0;
    if (entry.link) {
      const ref = getItemByRef(entry.link);
      const base = ref?.raw;
      const bonus = entry.Bonus != null && !isNaN(entry.Bonus) ? entry.Bonus : null;
      const Name = base
        ? (bonus != null ? `${base.Name} +${bonus}` : base.Name)
        : entry.link;
      const parts = entry.link.split('/');
      const ItemType = parts.length >= 2 ? parts[1] : 'Item';
      return {
        Name,
        Number,
        Cost,
        Link: entry.link,
        ...(bonus != null ? { Bonus: bonus } : {}),
        ItemType,
      };
    }
    return {
      Name: entry.Name ?? 'Unknown',
      Number,
      Cost,
      ItemType: 'Custom',
    };
  }).filter(i => i.Number > 0);
}
