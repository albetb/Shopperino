import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import Shop from './shop';
import {
  getItemByRef,
  getItemById,
  getItemIdByRef,
  getScrollById,
  getScrollIdByLink,
  getEffectById,
  getEffectIdBySlug,
} from './utils';

/** Max length of compressed string for QR code (fits in medium-sized QR). */
export const SHARE_QR_MAX_CHARS = 2500;

const DELIM = '|';
const VERSION = 'V1';

/**
 * Build share string in custom delimiter format (no JSON).
 * Format: V1|<nameLen>|<name>|<gold>|<count>|<entry>...
 * Entry type 0 (item): 0|<itemId>|<N>|<p>  or  0|<itemId>|<b>|<N>|<p>  or  0|<itemId>|<b>|<e1,e2>|<nameLen>|<name>|<N>|<p>
 * Entry type 1 (scroll): 1|<scrollId>|<N>|<p>
 * Entry type 2 (custom): 2|<nameLen>|<name>|<N>|<p>
 */
function buildShareString(serializedShop) {
  if (!serializedShop || !Array.isArray(serializedShop.Stock)) return null;
  const shop = new Shop().load(serializedShop);
  const inventory = shop.getInventory();
  if (!inventory.length) return null;

  const name = (serializedShop.Name || '').toString();
  const gold = Math.floor(Number(serializedShop.Gold) || 0);
  const parts = [VERSION, String(name.length), name, String(gold)];

  const entries = [];
  for (const item of inventory) {
    if (!item || (item.Number ?? 0) <= 0) continue;
    const N = Math.min(99, Math.max(1, parseInt(item.Number, 10) || 1));
    const totalPrice = (parseFloat(item.Cost) || 0) * N;
    const p = Math.round(totalPrice * 100) / 100;

    if (item.isCustom || !item.Link) {
      const n = (item.Name || 'Unknown').toString();
      entries.push([2, n.length, n, N, p]);
      continue;
    }

    if (item.ItemType === 'Scroll' && item.Link && item.Link.startsWith('scrolls/')) {
      const scrollId = getScrollIdByLink(item.Link);
      if (scrollId == null) continue;
      entries.push([1, scrollId, N, p]);
      continue;
    }

    const linkStr = typeof item.Link === 'string' ? item.Link : null;
    const linkArray = Array.isArray(item.Link) ? item.Link : null;

    if (linkArray && item.Name && item.BaseItemType) {
      const baseLink = `items/${item.BaseItemType}/${linkArray[0]}`;
      const itemId = getItemIdByRef(baseLink);
      if (itemId == null) continue;
      const bonus = item.Bonus != null && !isNaN(item.Bonus) ? parseInt(item.Bonus, 10) : 0;
      const effectIds = (item.Ability || [])
        .map(a => (a && a.Link ? getEffectIdBySlug(a.Link) : null))
        .filter(id => id != null);
      const n = (item.Name || '').toString();
      entries.push([0, itemId, bonus, effectIds.join(','), n.length, n, N, p]);
      continue;
    }

    if (linkStr && linkStr.includes('/')) {
      const itemId = getItemIdByRef(linkStr);
      if (itemId == null) continue;
      const bonus = item.Bonus != null && !isNaN(item.Bonus) ? parseInt(item.Bonus, 10) : null;
      if (bonus != null && !isNaN(bonus)) {
        entries.push([0, itemId, bonus, N, p]);
      } else {
        entries.push([0, itemId, N, p]);
      }
      continue;
    }

    const itemId = getItemIdByRef(linkStr);
    if (itemId == null) continue;
    entries.push([0, itemId, N, p]);
  }

  if (!entries.length) return null;
  parts.push(String(entries.length));
  for (const entry of entries) {
    parts.push(entry.join(DELIM));
  }
  return parts.join(DELIM);
}

/**
 * Parse custom-format share string into { name, gold, stock }.
 * stock entries: { link?, Number, Cost, Bonus?, effectIds?, Name?, isCustom? }
 * Type 0: 0|itemId|N|p  or  0|itemId|b|N|p  or  0|itemId|b|e1,e2|nameLen|name|N|p
 */
function parseShareString(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const segments = raw.split(DELIM);
  if (segments.length < 5 || segments[0] !== VERSION) return null;
  let idx = 1;
  const nameLen = parseInt(segments[idx++], 10);
  if (isNaN(nameLen) || nameLen < 0) return null;
  const name = segments[idx++];
  if (name == null || name.length !== nameLen) return null;
  const gold = parseInt(segments[idx++], 10);
  const count = parseInt(segments[idx++], 10);
  if (isNaN(count) || count < 0) return null;

  const costPerUnit = (n, pr) => (n > 0 ? pr / n : 0);
  const stock = [];

  for (let i = 0; i < count && idx < segments.length; i++) {
    const t = parseInt(segments[idx++], 10);
    if (t === 2) {
      const nameLen2 = parseInt(segments[idx++], 10);
      const name2 = segments[idx++];
      const N = parseInt(segments[idx++], 10) || 1;
      const p = parseFloat(segments[idx++]) || 0;
      stock.push({ Name: name2 || 'Unknown', Number: N, Cost: costPerUnit(N, p), isCustom: true });
      continue;
    }
    if (t === 1) {
      const scrollId = parseInt(segments[idx++], 10);
      const N = parseInt(segments[idx++], 10) || 1;
      const p = parseFloat(segments[idx++]) || 0;
      const ref = getScrollById(scrollId);
      if (!ref) continue;
      stock.push({
        link: `scrolls/${ref.source}/${ref.scroll.Link}`,
        Number: N,
        Cost: costPerUnit(N, p),
      });
      continue;
    }
    if (t === 0) {
      const itemId = parseInt(segments[idx++], 10);
      const ref = getItemById(itemId);
      if (!ref) continue;
      const baseLink = `items/${ref.itemType}/${ref.item.Link}`;
      const rem = segments.length - idx;
      if (rem >= 6 && segments[idx + 1] && String(segments[idx + 1]).includes(',')) {
        const b = parseInt(segments[idx], 10);
        const eList = segments[idx + 1];
        const nameLen3 = parseInt(segments[idx + 2], 10);
        const name3 = segments[idx + 3];
        const N3 = parseInt(segments[idx + 4], 10) || 1;
        const p3 = parseFloat(segments[idx + 5]) || 0;
        idx += 6;
        const effectIds = eList.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
        stock.push({
          link: baseLink,
          Bonus: b,
          effectIds,
          Name: name3 || undefined,
          Number: N3,
          Cost: costPerUnit(N3, p3),
        });
      } else if (rem >= 3) {
        const b = parseInt(segments[idx], 10);
        const N2 = parseInt(segments[idx + 1], 10) || 1;
        const p2 = parseFloat(segments[idx + 2]) || 0;
        idx += 3;
        stock.push({
          link: baseLink,
          Bonus: b,
          Number: N2,
          Cost: costPerUnit(N2, p2),
        });
      } else if (rem >= 2) {
        const N0 = parseInt(segments[idx], 10) || 1;
        const p0 = parseFloat(segments[idx + 1]) || 0;
        idx += 2;
        stock.push({
          link: baseLink,
          Number: N0,
          Cost: costPerUnit(N0, p0),
        });
      }
    }
  }

  return { name, gold, stock };
}

/**
 * Compress shop for sharing. Returns { ok: true, payload: encodedString } or { ok: false, error: '...' }.
 */
export function compressShopForShare(serializedShop) {
  const raw = buildShareString(serializedShop);
  if (!raw) return { ok: false, error: 'Shop has no items' };
  const compressed = compressToEncodedURIComponent(raw);
  if (compressed.length > SHARE_QR_MAX_CHARS) {
    return { ok: false, error: 'Shop is too large and cannot be shared via QR code.' };
  }
  return { ok: true, payload: compressed };
}

/**
 * Parse and validate shared shop string. Returns { ok: true, shop: { name, gold, stock } } or { ok: false, error }.
 */
export function parseSharedShop(encodedString) {
  if (!encodedString || typeof encodedString !== 'string') {
    return { ok: false, error: 'Invalid data' };
  }
  let raw;
  try {
    raw = decompressFromEncodedURIComponent(encodedString.trim());
    if (!raw) return { ok: false, error: 'Invalid or corrupted data' };
  } catch (e) {
    return { ok: false, error: 'Invalid or corrupted data' };
  }
  const parsed = parseShareString(raw);
  if (!parsed) return { ok: false, error: 'Invalid data' };
  return {
    ok: true,
    shop: {
      name: String(parsed.name),
      gold: parsed.gold,
      stock: parsed.stock,
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
