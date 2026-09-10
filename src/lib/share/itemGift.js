/**
 * Handing an item to another player, by QR code.
 *
 * The two phones never talk to each other, so the code on the screen *is* the
 * transfer: everything the receiving bag needs to build the same row has to fit
 * inside it. That is the whole magical identity of the row — a masterwork
 * flaming longsword +1 has to arrive as one, not as a longsword — plus any
 * overrides a master typed over it by hand.
 *
 * Deliberately **not** the compact `(fileCode, id)` pair the shop share uses:
 * that pair can only name a row out of `items.json` or `scrolls.json`, and half
 * of what a character carries is neither — a custom item has no link at all. A
 * gift is one row rather than a whole shelf, so it can afford the full link.
 *
 * Nothing here reads the language. A name is identity and travels in English,
 * exactly as it is stored, and is translated only where it is drawn.
 */
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

/* What tells a gift code from the shop's. The shop payload is bare base64url
   and its first character is fixed by the version nibble — always I, J, K or L
   — so the two can never be read for each other. Later kinds of code (an
   effect, say) get their own prefix beside this one. */
export const GIFT_PREFIX = 'gift1:';

const MAX_NUMBER = 9999;

const cleanEffectIds = (ids) => (
  Array.isArray(ids) ? ids.filter((n) => Number.isInteger(n)) : []
);

const cleanOverrides = (o) => {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const out = {};
  let count = 0;
  for (const [k, v] of Object.entries(o)) {
    if (!k || v === undefined || v === null) continue;
    out[k] = String(v);
    count += 1;
  }
  return count > 0 ? out : null;
};

const clampNumber = (n, max = MAX_NUMBER) => (
  Math.max(1, Math.min(max, Math.floor(Number(n) || 0) || 1))
);

/**
 * The gift a row of the inventory makes, in the quantity being handed over.
 *
 * @param {object} entry     one row of `player.getInventory()`
 * @param {number} quantity  how many leave the bag, clamped to what it holds
 */
export function giftFromInventoryEntry(entry, quantity) {
  if (!entry || !entry.Name) return null;
  const held = Math.max(1, Math.floor(Number(entry.Number) || 1));
  const gift = {
    name: String(entry.Name),
    type: String(entry.ItemType || 'Good'),
    number: clampNumber(quantity, held),
    link: typeof entry.Link === 'string' ? entry.Link : '',
    masterwork: !!entry.masterwork,
    bonus: Math.max(0, Math.min(5, parseInt(entry.bonus, 10) || 0)),
    effectIds: cleanEffectIds(entry.effectIds),
    baseLink: typeof entry.baseLink === 'string' ? entry.baseLink : '',
    overrides: cleanOverrides(entry.overrides),
  };
  return gift;
}

/**
 * The arguments `addInventoryItem(name, type, number, link, opts)` wants for a
 * received gift — the same shape `inventoryArgsFor` returns for a shop row, so
 * both ways of acquiring something end at the same call.
 */
export function inventoryArgsForGift(gift) {
  if (!gift || !gift.name) return null;
  const opts = {};
  if (gift.masterwork) opts.masterwork = true;
  if (gift.bonus) opts.bonus = gift.bonus;
  const effectIds = cleanEffectIds(gift.effectIds);
  if (effectIds.length) opts.effectIds = effectIds;
  if (gift.baseLink) opts.baseLink = gift.baseLink;
  const overrides = cleanOverrides(gift.overrides);
  if (overrides) opts.overrides = overrides;
  return {
    name: String(gift.name),
    type: String(gift.type || 'Good'),
    number: clampNumber(gift.number),
    link: typeof gift.link === 'string' ? gift.link : '',
    opts,
  };
}

/**
 * The string that goes into the QR image. Short keys and no default values:
 * a plain longsword is about forty characters, which a phone camera reads at
 * arm's length.
 */
export function encodeItemGift(gift) {
  if (!gift || !gift.name) return { ok: false, error: 'Nothing to give' };
  const compact = { n: String(gift.name), q: clampNumber(gift.number) };
  if (gift.type) compact.t = String(gift.type);
  if (gift.link) compact.l = String(gift.link);
  if (gift.masterwork) compact.m = 1;
  if (gift.bonus) compact.b = Math.max(0, Math.min(5, gift.bonus | 0));
  const effectIds = cleanEffectIds(gift.effectIds);
  if (effectIds.length) compact.e = effectIds;
  if (gift.baseLink) compact.k = String(gift.baseLink);
  const overrides = cleanOverrides(gift.overrides);
  if (overrides) compact.o = overrides;
  const body = compressToEncodedURIComponent(JSON.stringify(compact));
  if (!body) return { ok: false, error: 'Could not build the code' };
  return { ok: true, payload: `${GIFT_PREFIX}${body}` };
}

/** Whether a scanned string claims to be a gift at all. */
export function isItemGiftPayload(text) {
  return typeof text === 'string' && text.trim().startsWith(GIFT_PREFIX);
}

/**
 * Read a scanned gift back. Returns `{ ok: true, gift }` or `{ ok: false,
 * error }` — a torn or half-read code is a normal thing for a camera to see,
 * not an exception.
 */
export function parseItemGift(text) {
  if (!isItemGiftPayload(text)) return { ok: false, error: 'Not an item code' };
  const body = text.trim().slice(GIFT_PREFIX.length);
  let compact = null;
  try {
    const json = decompressFromEncodedURIComponent(body);
    compact = json ? JSON.parse(json) : null;
  } catch (_) {
    compact = null;
  }
  if (!compact || typeof compact !== 'object' || !compact.n) {
    return { ok: false, error: 'Invalid or corrupted data' };
  }
  return {
    ok: true,
    gift: {
      name: String(compact.n),
      type: compact.t ? String(compact.t) : 'Good',
      number: clampNumber(compact.q),
      link: compact.l ? String(compact.l) : '',
      masterwork: !!compact.m,
      bonus: Math.max(0, Math.min(5, parseInt(compact.b, 10) || 0)),
      effectIds: cleanEffectIds(compact.e),
      baseLink: compact.k ? String(compact.k) : '',
      overrides: cleanOverrides(compact.o),
    },
  };
}
