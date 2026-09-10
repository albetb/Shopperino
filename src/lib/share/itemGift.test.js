import {
  giftFromInventoryEntry,
  inventoryArgsForGift,
  encodeItemGift,
  parseItemGift,
  isItemGiftPayload,
} from './itemGift';

/**
 * The code on the screen is the whole transfer — the two phones never talk —
 * so what matters here is that nothing about the item is lost between the two
 * bags. A masterwork flaming longsword +1 has to arrive as one.
 */

const sword = {
  Name: 'Longsword',
  ItemType: 'Weapon',
  Number: 3,
  Link: 'items/Weapon/longsword',
  masterwork: true,
  bonus: 1,
  effectIds: [12, 4],
  baseLink: 'items/Weapon/longsword',
  overrides: { Name: 'Dawnbreaker', Cost: '9000' },
};

describe('a gift made out of an inventory row', () => {
  test('carries the whole magical identity, and the quantity being handed over', () => {
    const gift = giftFromInventoryEntry(sword, 2);
    expect(gift).toEqual({
      name: 'Longsword',
      type: 'Weapon',
      number: 2,
      link: 'items/Weapon/longsword',
      masterwork: true,
      bonus: 1,
      effectIds: [12, 4],
      baseLink: 'items/Weapon/longsword',
      overrides: { Name: 'Dawnbreaker', Cost: '9000' },
    });
  });

  test('cannot hand over more than the bag holds', () => {
    expect(giftFromInventoryEntry(sword, 99).number).toBe(3);
    expect(giftFromInventoryEntry(sword, 0).number).toBe(1);
  });

  test('the receiving bag is told exactly what to add', () => {
    const args = inventoryArgsForGift(giftFromInventoryEntry(sword, 2));
    expect(args).toEqual({
      name: 'Longsword',
      type: 'Weapon',
      number: 2,
      link: 'items/Weapon/longsword',
      opts: {
        masterwork: true,
        bonus: 1,
        effectIds: [12, 4],
        baseLink: 'items/Weapon/longsword',
        overrides: { Name: 'Dawnbreaker', Cost: '9000' },
      },
    });
  });

  test('a plain item asks for nothing it has not got', () => {
    const args = inventoryArgsForGift(giftFromInventoryEntry(
      { Name: 'Rope', ItemType: 'Good', Number: 1, Link: 'items/Good/rope' }, 1
    ));
    expect(args.opts).toEqual({});
  });
});

describe('the code itself', () => {
  test('survives the round trip unchanged', () => {
    const gift = giftFromInventoryEntry(sword, 2);
    const { ok, payload } = encodeItemGift(gift);
    expect(ok).toBe(true);
    expect(isItemGiftPayload(payload)).toBe(true);
    expect(parseItemGift(payload)).toEqual({ ok: true, gift });
  });

  test('a hand-written item with no link at all still travels', () => {
    const gift = giftFromInventoryEntry(
      { Name: "Grandfather's pipe", ItemType: 'Good', Number: 1 }, 1
    );
    const { payload } = encodeItemGift(gift);
    expect(parseItemGift(payload).gift.name).toBe("Grandfather's pipe");
    expect(parseItemGift(payload).gift.link).toBe('');
  });

  test('a plain item fits in a code a phone can read at arm\'s length', () => {
    const { payload } = encodeItemGift(giftFromInventoryEntry(
      { Name: 'Rope', ItemType: 'Good', Number: 1, Link: 'items/Good/rope' }, 1
    ));
    expect(payload.length).toBeLessThan(120);
  });

  test('anything that is not a gift is refused rather than guessed at', () => {
    expect(parseItemGift('').ok).toBe(false);
    expect(parseItemGift('IJKLmnop').ok).toBe(false);
    /* A code cut in half by a bad camera angle. */
    const { payload } = encodeItemGift(giftFromInventoryEntry(sword, 1));
    expect(parseItemGift(payload.slice(0, payload.length - 6)).ok).toBe(false);
  });
});
