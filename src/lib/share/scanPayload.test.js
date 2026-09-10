import { readScannedPayload } from './scanPayload';
import { encodeItemGift, giftFromInventoryEntry } from './itemGift';
import { encodeEffectShare } from './effectShare';
import { encodeShopPayloadToBase64Url } from '../shop';
import { compressToEncodedURIComponent } from 'lz-string';

/**
 * One button, one camera, more than one kind of code. The reader is what keeps
 * a shop from being mistaken for an item — and, when the effects follow, from
 * being mistaken for either.
 */

const giftPayload = () => encodeItemGift(giftFromInventoryEntry(
  { Name: 'Longsword', ItemType: 'Weapon', Number: 1, Link: 'items/Weapon/longsword' }, 1
)).payload;

const shopPayload = () => encodeShopPayloadToBase64Url(
  { seed: 1234, shopTypeIndex: 0, level: 2, cityLevel: 1, playerLevel: 3, reputation: 0 },
  [], [], [], 0
);

test('an item code reads as an item', () => {
  const result = readScannedPayload(giftPayload());
  expect(result).toMatchObject({ ok: true, kind: 'gift' });
  expect(result.gift.name).toBe('Longsword');
});

test('a shop code reads as a shop', () => {
  const result = readScannedPayload(shopPayload());
  expect(result).toMatchObject({ ok: true, kind: 'shop' });
  expect(Array.isArray(result.shop.stock)).toBe(true);
});

test('the two are never read for each other', () => {
  /* The shop payload is bare base64url and its first character is fixed by the
     version nibble, so it cannot begin with the gift prefix. */
  expect(shopPayload().startsWith('gift1:')).toBe(false);
  expect(readScannedPayload(giftPayload()).kind).not.toBe('shop');
});

test('a damaged item code is a damaged item, not an offer to the shop reader', () => {
  const torn = giftPayload().slice(0, 10);
  const result = readScannedPayload(torn);
  expect(result.ok).toBe(false);
  expect(result.error).toBeTruthy();
});

test('a code from something else entirely is refused', () => {
  expect(readScannedPayload('https://example.com').ok).toBe(false);
  expect(readScannedPayload('').ok).toBe(false);
});

describe('the third kind of code', () => {
  const effectPayload = () => encodeEffectShare({
    id: 'inspireCourage', bonus: 2, from: 'Lyra',
  }).payload;

  test('an effect code reads as an effect', () => {
    const result = readScannedPayload(effectPayload());
    expect(result).toMatchObject({ ok: true, kind: 'effect' });
    expect(result.effect).toEqual({ id: 'inspireCourage', bonus: 2, from: 'Lyra' });
  });

  test('and is never read as one of the other two', () => {
    expect(readScannedPayload(effectPayload()).kind).toBe('effect');
    expect(readScannedPayload(giftPayload()).kind).toBe('gift');
    expect(readScannedPayload(shopPayload()).kind).toBe('shop');
  });

  test('a song this build has never heard of is refused', () => {
    /* A code written by a newer version of the app. Refusing it is the point:
       an effect that resolved to nothing would sit on the sheet looking as
       though it had worked. */
    const fromTheFuture = `buff1:${compressToEncodedURIComponent(
      JSON.stringify({ i: 'inspireSomethingNew', n: 9 })
    )}`;
    expect(readScannedPayload(fromTheFuture).ok).toBe(false);
  });
});
