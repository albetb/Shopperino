import { t, tx, tName } from './index';

/**
 * A trap, in the reading language.
 *
 * The trap tool is two kinds of string. Its vocabulary — the type, the trigger,
 * the reset, the bypass — is an enum in `traps.json`, read by the CR and cost
 * tables under both its id (`proximity`) and its printed label (`Proximity`),
 * so it is keyed once in `names.json` and looked up under either: the pack is
 * case-blind and answers in the case it was asked in.
 *
 * The breakdown rows are the other kind. `trapCR` and `trapCost` compose a
 * label per row — "Search DC 25", "Reset: automatic" — and they must keep
 * composing it in English: they are pure model code, tested on those exact
 * strings, and a model that reads the current language is a model whose numbers
 * cannot be tested. So the sentence is taken apart again here, at render, and
 * the number is put back into the translated template.
 */

/** A sample trap's own name. */
export const trapName = (en) => tName('traps', String(en ?? ''));

/** A type, trigger, reset, bypass or feature — by id or by printed label. */
export const trapTerm = (en) => tName('trapTerms', String(en ?? ''));

/* Every shape a breakdown row's label takes, in the order they are tried. A
   pattern either captures the part that varies, or matches the whole label
   because nothing in it does. Keep in step with `part` in trapCR.js and `line`
   in trapCost.js — the tests there assert on these same strings. */
const ROW_PATTERNS = [
  [/^Search DC (\d+)$/, 'Search DC {0}'],
  [/^Disable Device DC (\d+)$/, 'Disable Device DC {0}'],
  [/^Reflex DC (\d+)$/, 'Reflex DC {0}'],
  [/^Attack bonus \+(\d+)$/, 'Attack bonus +{0}'],
  [/^Highest spell level (\d+)$/, 'Highest spell level {0}'],
  [/^CR (\d+)$/, 'CR {0}'],
  [/^Onset delay (\d+) round$/, 'Onset delay {0} round'],
  [/^Onset delay (\d+) rounds$/, 'Onset delay {0} rounds'],
];

/* Three rows name a value out of the enum tables rather than a number. */
const ROW_TERMS = [
  [/^Trigger: (.+)$/, 'Trigger: {0}'],
  [/^Reset: (.+)$/, 'Reset: {0}'],
  [/^Bypass: (.+)$/, 'Bypass: {0}'],
];

/* "Average damage 12.5 → 3" — the arrow is the rounding, and both halves are
   the trap's own numbers. */
const AVERAGE_DAMAGE = /^Average damage (.+) → (.+)$/;
/* "Poison: Greenblood oil" — the poison is an item name. */
const POISON = /^Poison: (.+)$/;

/**
 * One row of a CR, cost or Craft DC breakdown.
 *
 * Anything the patterns do not recognise falls through to `t`, which covers
 * the dozen rows that are a fixed phrase — "Base cost", "Never miss",
 * "Pit spikes", "Minimum for a trap" — and leaves an unknown one in English
 * rather than blank.
 */
export function trapRowLabel(en) {
  const text = String(en ?? '').trim();
  if (!text) return text;

  for (const [pattern, template] of ROW_PATTERNS) {
    const m = pattern.exec(text);
    if (m) return tx(template, m[1]);
  }
  for (const [pattern, template] of ROW_TERMS) {
    const m = pattern.exec(text);
    if (m) return tx(template, trapTerm(m[1]));
  }

  const damage = AVERAGE_DAMAGE.exec(text);
  if (damage) return tx('Average damage {0} → {1}', damage[1], damage[2]);

  const poison = POISON.exec(text);
  if (poison) return tx('Poison: {0}', tName('items', poison[1]));

  return t(text);
}
