import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import Shop from './shop';
import {
  loadFile,
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
const VERSION = 'V2';
const NO_BONUS = '-';

/** Letter → file name from data/tables.json ShareFileMap. Decode uses this to know which file an id refers to. */
function getShareFileMap() {
  const tables = loadFile('tables');
  const map = tables && tables.ShareFileMap && typeof tables.ShareFileMap === 'object' ? tables.ShareFileMap : null;
  return map || { i: 'items', s: 'scrolls' };
}

/** File name → letter for encoding. */
function getFileToLetter() {
  const letterToFile = getShareFileMap();
  const fileToLetter = {};
  for (const [letter, file] of Object.entries(letterToFile)) fileToLetter[file] = letter;
  return fileToLetter;
}

/**
 * Build share string: id-based with file letter (from tables.json ShareFileMap) for compression.
 * Format: V2|<nameLen>|<name>|<gold>|<count>|<entry>...
 * Entry type 0 (ref): 0|<f>|<id>|<bOr->|N|p  (bOr- = "-" for no bonus, or bonus number)  or  0|<f>|<id>|b|e1,e2|nameLen|name|N|p  for effects
 * Entry type 2 (custom): 2|<nameLen>|<name>|N|p
 */
function buildShareString(serializedShop) {
  if (!serializedShop || !Array.isArray(serializedShop.Stock)) return null;
  const shop = new Shop().load(serializedShop);
  const inventory = shop.getInventory();
  if (!inventory.length) return null;

  const fileToLetter = getFileToLetter();
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

    const linkStr = typeof item.Link === 'string' ? item.Link : null;
    const linkArray = Array.isArray(item.Link) ? item.Link : null;

    if (linkStr && linkStr.startsWith('scrolls/')) {
      const scrollId = getScrollIdByLink(linkStr);
      if (scrollId == null) continue;
      const f = fileToLetter['scrolls'] || 's';
      entries.push([0, f, scrollId, NO_BONUS, N, p]);
      continue;
    }

    if (linkArray && item.Name && item.BaseItemType) {
      const baseLink = `items/${item.BaseItemType}/${linkArray[0]}`;
      const itemId = getItemIdByRef(baseLink);
      if (itemId == null) continue;
      const f = fileToLetter['items'] || 'i';
      const bonus = item.Bonus != null && !isNaN(item.Bonus) ? parseInt(item.Bonus, 10) : 0;
      const effectIds = (item.Ability || [])
        .map(a => (a && a.Link ? getEffectIdBySlug(a.Link) : null))
        .filter(id => id != null);
      const n = (item.Name || '').toString();
      entries.push([0, f, itemId, bonus, effectIds.join(','), n.length, n, N, p]);
      continue;
    }

    if (linkStr && linkStr.length > 0) {
      const itemId = getItemIdByRef(linkStr);
      if (itemId == null) continue;
      const f = fileToLetter['items'] || 'i';
      const bonus = item.Bonus != null && !isNaN(item.Bonus) ? parseInt(item.Bonus, 10) : null;
      const bOrNo = bonus != null && !isNaN(bonus) ? String(bonus) : NO_BONUS;
      entries.push([0, f, itemId, bOrNo, N, p]);
      continue;
    }
  }

  if (!entries.length) return null;
  parts.push(String(entries.length));
  for (const entry of entries) {
    parts.push(entry.join(DELIM));
  }
  return parts.join(DELIM);
}

/**
 * Resolve id in a given file (from ShareFileMap) to link. Returns link string or null.
 */
function idToLink(fileLetter, idNum) {
  const letterToFile = getShareFileMap();
  const file = letterToFile[fileLetter];
  if (!file || idNum == null || typeof idNum !== 'number') return null;
  if (file === 'items') {
    const ref = getItemById(idNum);
    return ref ? `items/${ref.itemType}/${ref.item.Link}` : null;
  }
  if (file === 'scrolls') {
    const ref = getScrollById(idNum);
    return ref ? `scrolls/${ref.source}/${ref.scroll.Link}` : null;
  }
  return null;
}

/**
 * Parse custom-format share string into { name, gold, stock }.
 * V2: type 0 = 0|<f>|<id>|<bOr->|N|p  (bOr- = "-" no bonus, else bonus)  or  0|<f>|<id>|b|e1,e2|nameLen|name|N|p  for effects.
 * Type 2: 2|nameLen|name|N|p.
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
    if (t === 0) {
      const f = segments[idx++];
      const idNum = parseInt(segments[idx++], 10);
      const link = idToLink(f, idNum);
      const fourth = segments[idx];
      const nextSeg = segments[idx + 1];
      const isNoBonus = fourth === NO_BONUS;
      const isEffects = nextSeg != null && String(nextSeg).includes(',');
      if (isEffects && !isNoBonus) {
        const b = parseInt(segments[idx], 10);
        const eList = segments[idx + 1];
        const nameLen3 = parseInt(segments[idx + 2], 10);
        const name3 = segments[idx + 3];
        const N3 = parseInt(segments[idx + 4], 10) || 1;
        const p3 = parseFloat(segments[idx + 5]) || 0;
        idx += 6;
        const effectIds = eList.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
        if (link) {
          stock.push({
            link,
            Bonus: b,
            effectIds,
            Name: name3 || undefined,
            Number: N3,
            Cost: costPerUnit(N3, p3),
          });
        }
      } else if (isNoBonus) {
        const N0 = parseInt(segments[idx + 1], 10) || 1;
        const p0 = parseFloat(segments[idx + 2]) || 0;
        idx += 3;
        if (link) {
          stock.push({
            link,
            Number: N0,
            Cost: costPerUnit(N0, p0),
          });
        }
      } else {
        const b = parseInt(segments[idx], 10);
        const N2 = parseInt(segments[idx + 1], 10) || 1;
        const p2 = parseFloat(segments[idx + 2]) || 0;
        idx += 3;
        if (link) {
          stock.push({
            link,
            Bonus: b,
            Number: N2,
            Cost: costPerUnit(N2, p2),
          });
        }
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
