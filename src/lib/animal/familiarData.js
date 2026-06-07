/**
 * Wizard / sorcerer familiar availability data and advancement math.
 *
 * Source of truth: obsidian-vault/dnd-rules/familiar.md.
 *  - A fixed list of 10 species, no level adjustment (all selectable at L1).
 *  - Each species grants a fixed per-species bonus TO THE MASTER. The bonus is
 *    structured so the Player model can auto-apply it ({ kind, target, value,
 *    condition? }). The two Spot bonuses (Hawk = bright light, Owl = shadows)
 *    carry a `condition` and are display-only (the sheet can't track lighting).
 *  - The advancement table is indexed by MASTER CLASS LEVEL and improves the
 *    familiar's natural-armor adjustment and Intelligence score, and grants
 *    cumulative special abilities.
 *
 * All game logic is pure here; no React, no persistence.
 */

/**
 * The 10 familiar species. `bonus` is the master-facing per-species bonus:
 *  - kind 'skill' → target is a skill name (matches src/data/skills.json names)
 *  - kind 'save'  → target is 'fort' | 'reflex'
 *  - kind 'hp'    → flat max-HP bonus (target null)
 * `bonus.text` is the short descriptor shown in the dropdown label.
 */
const FAMILIAR_SPECIES = [
  { ref: 'animals/bat', name: 'Bat', bonus: { kind: 'skill', target: 'Listen', value: 3, text: '+3 listen' } },
  { ref: 'animals/cat', name: 'Cat', bonus: { kind: 'skill', target: 'Move Silently', value: 3, text: '+3 move silently' } },
  { ref: 'animals/hawk', name: 'Hawk', bonus: { kind: 'skill', target: 'Spot', value: 3, condition: 'in bright light', text: '+3 spot' } },
  { ref: 'animals/lizard', name: 'Lizard', bonus: { kind: 'skill', target: 'Climb', value: 3, text: '+3 climb' } },
  { ref: 'animals/owl', name: 'Owl', bonus: { kind: 'skill', target: 'Spot', value: 3, condition: 'in shadows', text: '+3 spot' } },
  { ref: 'animals/rat', name: 'Rat', bonus: { kind: 'save', target: 'fort', value: 2, text: '+2 fort' } },
  { ref: 'animals/raven', name: 'Raven', bonus: { kind: 'skill', target: 'Appraise', value: 3, text: '+3 appraise' }, note: "Can speak one language of the master's choice." },
  { ref: 'animals/snake-tiny-viper', name: 'Snake', bonus: { kind: 'skill', target: 'Bluff', value: 3, text: '+3 bluff' } },
  { ref: 'animals/toad', name: 'Toad', bonus: { kind: 'hp', target: null, value: 3, text: '+3 hit points' } },
  { ref: 'animals/weasel', name: 'Weasel', bonus: { kind: 'save', target: 'reflex', value: 2, text: '+2 reflex' } },
];

/**
 * Advancement table indexed by master class level (familiar.md). `gained` is the
 * set of special abilities first gained in that band; the resolved list is the
 * cumulative union up to the master's level.
 */
const ADVANCEMENT_BANDS = [
  { min: 1, max: 2, naturalArmorAdj: 1, int: 6, gained: ['Alertness', 'Improved Evasion', 'Share Spells', 'Empathic Link'] },
  { min: 3, max: 4, naturalArmorAdj: 2, int: 7, gained: ['Deliver Touch Spells'] },
  { min: 5, max: 6, naturalArmorAdj: 3, int: 8, gained: ['Speak with Master'] },
  { min: 7, max: 8, naturalArmorAdj: 4, int: 9, gained: ['Speak with Animals of Its Kind'] },
  { min: 9, max: 10, naturalArmorAdj: 5, int: 10, gained: [] },
  { min: 11, max: 12, naturalArmorAdj: 6, int: 11, gained: ['Spell Resistance'] },
  { min: 13, max: 14, naturalArmorAdj: 7, int: 12, gained: ['Scry on Familiar'] },
  { min: 15, max: 16, naturalArmorAdj: 8, int: 13, gained: [] },
  { min: 17, max: 18, naturalArmorAdj: 9, int: 14, gained: [] },
  { min: 19, max: 20, naturalArmorAdj: 10, int: 15, gained: [] },
];

/**
 * The 10 familiar species as { ref, name, bonus, note, label } where `label`
 * is the dropdown text, e.g. "Bat (+3 listen)" / "Toad (+3 hit points)".
 */
export function getFamiliarSpecies() {
  return FAMILIAR_SPECIES.map((s) => ({
    ref: s.ref,
    name: s.name,
    bonus: { ...s.bonus },
    note: s.note || null,
    label: `${s.name} (${s.bonus.text})`,
  }));
}

/** The structured per-species bonus for a ref, or null if not a familiar species. */
export function getFamiliarBonus(ref) {
  const want = String(ref || '').trim();
  const s = FAMILIAR_SPECIES.find((x) => x.ref === want);
  return s ? { ...s.bonus } : null;
}

/**
 * Advancement adjustments for a master class level:
 * { naturalArmorAdj, int, specials }. `specials` is the cumulative list of
 * special abilities gained so far. Below level 1 returns the zero band.
 */
export function getFamiliarAdvancement(masterLevel) {
  const lvl = Math.floor(Number(masterLevel) || 0);
  if (lvl < 1) return { naturalArmorAdj: 0, int: 0, specials: [] };
  const clamped = Math.min(lvl, 20);
  const specials = [];
  let current = ADVANCEMENT_BANDS[0];
  for (const band of ADVANCEMENT_BANDS) {
    if (clamped >= band.min) {
      specials.push(...band.gained);
      current = band; // bands ascend, so the last satisfied band wins
    }
  }
  return { naturalArmorAdj: current.naturalArmorAdj, int: current.int, specials };
}

/** True when the given ref is one of the 10 familiar species. */
export function isFamiliarSpecies(ref) {
  const want = String(ref || '').trim();
  return FAMILIAR_SPECIES.some((s) => s.ref === want);
}
