/**
 * What a scanned QR code turned out to be.
 *
 * The camera does not know what it is looking at, and there is only one scan
 * button, so the reading happens here: every kind of code the app can produce
 * is tried in turn and the caller is told which one answered: a master's shop,
 * an item another player is handing over, an effect a bard is singing at you.
 * A new kind is one more branch here and one more case in the handler, rather
 * than another button for the reader to choose between first.
 */
import { isItemGiftPayload, parseItemGift } from './itemGift';
import { isEffectSharePayload, parseEffectShare } from './effectShare';
import { parseSharedShop } from '../shop';

/**
 * @param {string} text  exactly what the camera read
 * @returns {{ ok: true, kind: 'gift', gift: object }
 *   | { ok: true, kind: 'effect', effect: object }
 *   | { ok: true, kind: 'shop', shop: object }
 *   | { ok: false, error: string }}
 */
export function readScannedPayload(text) {
  const data = typeof text === 'string' ? text.trim() : '';
  if (!data) return { ok: false, error: 'Invalid data' };

  /* Asked by its prefix rather than by trying the parse: a gift code that is
     damaged should read as a damaged gift, not fall through and be offered to
     the shop decoder as if it might be a shop. */
  if (isItemGiftPayload(data)) {
    const result = parseItemGift(data);
    return result.ok
      ? { ok: true, kind: 'gift', gift: result.gift }
      : { ok: false, error: result.error };
  }

  if (isEffectSharePayload(data)) {
    const result = parseEffectShare(data);
    return result.ok
      ? { ok: true, kind: 'effect', effect: result.effect }
      : { ok: false, error: result.error };
  }

  const shop = parseSharedShop(data);
  if (shop.ok) return { ok: true, kind: 'shop', shop: shop.shop };
  return { ok: false, error: shop.error || 'Invalid or corrupted data' };
}
