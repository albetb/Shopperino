import { tName } from './index';

/**
 * The gems and art objects a hoard rolls.
 *
 * These are the one part of the loot tool that is not an item: `generateGems`
 * and `generateArt` in lib/loot/loot.js hold their own name pools, because the
 * book prints them as treasure-table entries rather than as things a shop
 * stocks. They are stored on the loot exactly as those pools spell them — a
 * shared loot code puts the name on the wire — so, like every other name, the
 * English is the key and the translation happens on the way to the screen.
 */
export const goodsName = (en) => tName('goods', String(en ?? ''));
