import { loadFile } from '../loadFile';

/**
 * Metamagic: the encoding, the slot arithmetic, and the words for both.
 *
 * A metamagic'd preparation is not the same preparation as a plain one — a
 * wizard may hold one ordinary *magic missile* and one maximized *magic
 * missile* at the same time, in two different slots. So the spellbook's spell
 * tuple grew a fourth element and identity became `(spellId, mm)` rather than
 * `spellId` alone.
 *
 *     [id, prepared, used]  ->  [id, prepared, used, mm?]
 *
 * `mm` is one integer, omitted while it is 0 — which is every preparation that
 * carries no metamagic at all, i.e. nearly all of them. That is what keeps a
 * save written before this feature existed a valid save: it is three elements
 * long, and three elements means `mm === 0`.
 *
 * **Bit order is fixed here by name, never by position in feats.json.** The
 * numbers are stored in the user's localStorage, so re-ordering the data file
 * must not silently turn every empowered spell into a quickened one. What *is*
 * read from the data is each feat's slot adjustment (`spellSlotMalus`), which
 * is the one number that belongs to the feat rather than to this encoding.
 */

/** Bit position per feat. Append only — never re-order, never reuse. */
const BITS = [
  'Empower spell',
  'Enlarge spell',
  'Extend spell',
  'Maximize spell',
  'Quicken spell',
  'Silent spell',
  'Still spell',
  'Widen spell',
];

/** Heighten's target level lives above the bits, as a nibble. */
const HEIGHTEN_SHIFT = 8;
const HEIGHTEN_MASK = 0xf;
export const HEIGHTEN = 'Heighten spell';

/** The highest level a spell can be heightened to. */
export const MAX_HEIGHTEN_LEVEL = 9;

/** Every metamagic feat, in the order the popovers list them. */
export const METAMAGIC_FEATS = [...BITS, HEIGHTEN].sort();

/** Past-participle label per feat — what the pill beside the spell name says. */
const LABELS = {
  'Empower spell': 'Empowered',
  'Enlarge spell': 'Enlarged',
  'Extend spell': 'Extended',
  'Heighten spell': 'Heightened',
  'Maximize spell': 'Maximized',
  'Quicken spell': 'Quickened',
  'Silent spell': 'Silent',
  'Still spell': 'Stilled',
  'Widen spell': 'Widened',
};

/** The slot shift each feat costs, read from feats.json rather than repeated. */
function slotAdjustments() {
  const feats = loadFile('feats') || [];
  return feats.reduce((acc, feat) => {
    if (!Array.isArray(feat?.Tags) || !feat.Tags.includes('Metamagic')) return acc;
    acc[feat.Name] = Math.max(0, Number(feat.spellSlotMalus) || 0);
    return acc;
  }, {});
}

let _adjustments = null;
/** `{ 'Empower spell': 2, ... }` — the +NSp each feat costs, by feat name. */
export function getSlotAdjustments() {
  if (!_adjustments) _adjustments = slotAdjustments();
  return _adjustments;
}

/** The slot shift one feat costs, or 0 for anything that is not metamagic. */
export function getSlotAdjustment(name) {
  return getSlotAdjustments()[name] ?? 0;
}

/** True for a feat whose adjustment is a target level rather than a number. */
export function isVariable(name) {
  return name === HEIGHTEN;
}

/**
 * Pack a choice into the stored integer.
 *
 * @param {string[]} feats - Feat names, any order; unknown names are ignored.
 * @param {number} [heightenTo] - Target spell level, when Heighten is applied.
 */
export function encodeMetamagic(feats = [], heightenTo = 0) {
  let mm = 0;
  const names = new Set(Array.isArray(feats) ? feats : []);
  BITS.forEach((name, i) => { if (names.has(name)) mm |= (1 << i); });
  const target = Math.max(0, Math.min(MAX_HEIGHTEN_LEVEL, Math.floor(Number(heightenTo) || 0)));
  if (names.has(HEIGHTEN) && target > 0) mm |= (target & HEIGHTEN_MASK) << HEIGHTEN_SHIFT;
  return mm;
}

/** Unpack the stored integer. Heighten appears only when it has a target. */
export function decodeMetamagic(mm) {
  const value = Math.max(0, Math.floor(Number(mm) || 0));
  const feats = BITS.filter((_, i) => value & (1 << i));
  const heightenTo = (value >> HEIGHTEN_SHIFT) & HEIGHTEN_MASK;
  if (heightenTo > 0) feats.push(HEIGHTEN);
  return { feats, heightenTo };
}

/** The level Heighten pushes the spell to, or 0 when it is not applied. */
export function getHeightenTarget(mm) {
  return (Math.max(0, Math.floor(Number(mm) || 0)) >> HEIGHTEN_SHIFT) & HEIGHTEN_MASK;
}

/** Whether one feat is part of a packed value. */
export function hasMetamagic(mm, name) {
  return decodeMetamagic(mm).feats.includes(name);
}

/** Add or remove one feat, returning the new packed value. */
export function toggleMetamagic(mm, name, on, heightenTo = 0) {
  const { feats, heightenTo: current } = decodeMetamagic(mm);
  const next = new Set(feats);
  if (on) next.add(name); else next.delete(name);
  const target = name === HEIGHTEN
    ? (on ? (heightenTo || current) : 0)
    : current;
  return encodeMetamagic([...next], target);
}

/**
 * The **effective** level of the spell — what every level-dependent effect is
 * calculated from: the save DC, the ability to pierce a lesser globe, dispel
 * checks.
 *
 * Heighten is the only metamagic feat that moves it. Every other one leaves
 * the spell working exactly as its own level says while occupying a bigger
 * slot, which is why the two numbers below are different questions.
 */
export function effectiveSpellLevel(baseLevel, mm) {
  const base = Math.max(0, Number(baseLevel) || 0);
  return Math.max(base, getHeightenTarget(mm));
}

/**
 * The **slot** the preparation occupies: the effective level plus every fixed
 * adjustment.
 *
 * Not clamped to 9. A maximized 9th-level spell wants a 12th-level slot and
 * there is no such thing — per the non-enforcing rule that is shown and
 * flagged, not refused.
 */
export function modifiedSpellLevel(baseLevel, mm) {
  const { feats } = decodeMetamagic(mm);
  const fixed = feats
    .filter((name) => name !== HEIGHTEN)
    .reduce((sum, name) => sum + getSlotAdjustment(name), 0);
  return effectiveSpellLevel(baseLevel, mm) + fixed;
}

/** True when the modified slot is one no caster could ever have. */
export function isImpossibleSlot(baseLevel, mm) {
  return modifiedSpellLevel(baseLevel, mm) > 9;
}

/** Short pill labels for a packed value, in a stable order. */
export function metamagicLabels(mm) {
  const { feats, heightenTo } = decodeMetamagic(mm);
  return feats
    .slice()
    .sort()
    .map((name) => (name === HEIGHTEN ? `Heightened to ${heightenTo}` : (LABELS[name] || name)));
}

/** The label for one feat on its own. */
export function metamagicLabel(name) {
  return LABELS[name] || name;
}

/** How many feats a packed value carries. */
export function metamagicCount(mm) {
  return decodeMetamagic(mm).feats.length;
}
