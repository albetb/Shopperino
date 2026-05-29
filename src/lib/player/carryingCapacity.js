/**
 * D&D 3.5 carrying capacity table (kg), keyed by Strength score 1–29.
 * Each entry is the MAX of [light, medium, heavy] load. Heavy ≈ light × 3.
 * Source: equipment.md "Carrying capacity (by Strength)" / capacita_trasporto.csv.
 *
 * For Str ≥ 30, apply the doubling rule (every +10 Str multiplies the
 * capacity by 4) — see `getCapacityForStr` below.
 */
const TABLE = {
  1:  [1.5,   3,     5],
  2:  [3,     6.5,   10],
  3:  [5,     10,    15],
  4:  [6.5,   13,    20],
  5:  [8,     16.5,  25],
  6:  [10,    20,    30],
  7:  [11.5,  23,    35],
  8:  [13,    26.5,  40],
  9:  [15,    30,    45],
  10: [16.5,  33,    50],
  11: [19,    38,    57.5],
  12: [21.5,  43,    65],
  13: [25,    50,    75],
  14: [29,    58,    87.5],
  15: [33,    66.5,  100],
  16: [38,    76.5,  115],
  17: [43,    86.5,  130],
  18: [50,    100,   150],
  19: [58,    116.5, 175],
  20: [66.5,  133,   200],
  21: [76.5,  153,   230],
  22: [86.5,  173,   260],
  23: [100,   200,   300],
  24: [116.5, 233,   350],
  25: [133,   266.5, 400],
  26: [153,   306.5, 460],
  27: [173,   346.5, 520],
  28: [200,   400,   600],
  29: [233,   466.5, 700],
};

/** Biped size multipliers (PHB Table: Size & Carrying Capacity). */
const BIPED_SIZE_MULT = {
  Fine:       1 / 8,
  Diminutive: 1 / 4,
  Tiny:       1 / 2,
  Small:      3 / 4,
  Medium:     1,
  Large:      2,
  Huge:       4,
  Gargantuan: 8,
  Colossal:   16,
};

/** Quadruped multipliers — kept for completeness, no PC race uses them today. */
const QUADRUPED_SIZE_MULT = {
  Fine:       1 / 4,
  Diminutive: 1 / 2,
  Tiny:       3 / 4,
  Small:      1,
  Medium:     1.5,
  Large:      3,
  Huge:       6,
  Gargantuan: 12,
  Colossal:   24,
};

/**
 * Base capacity ([light, medium, heavy] max kg) for a given Str score.
 * Handles Str ≥ 30 via the +10 → ×4 doubling rule: e.g. Str 30 = Str 20 × 4,
 * Str 35 = Str 25 × 4, Str 40 = Str 20 × 16.
 * @param {number} str
 * @returns {[number, number, number]}
 */
export function getCapacityForStr(str) {
  const n = Math.floor(Number(str) || 0);
  if (n <= 0) return [0, 0, 0];
  if (n <= 29) return TABLE[n];
  const ones = n % 10;
  const base = ones + 20;            // 20..29
  const decades = (n - base) / 10;   // how many full +10s past 20–29
  const mult = 4 ** decades;
  return TABLE[base].map(v => v * mult);
}

/**
 * Full carrying capacity for a character with the given Str + size + shape.
 * Returns { light, medium, heavy } max kg.
 */
export function getCarryingCapacity(str, size = 'Medium', shape = 'biped') {
  const base = getCapacityForStr(str);
  const table = shape === 'quadruped' ? QUADRUPED_SIZE_MULT : BIPED_SIZE_MULT;
  const mult = table[size] ?? 1;
  return {
    light:  base[0] * mult,
    medium: base[1] * mult,
    heavy:  base[2] * mult,
  };
}

/**
 * Classify a load weight against the capacity tiers.
 * @returns {'none' | 'light' | 'medium' | 'heavy' | 'over'}
 */
export function classifyLoad(weight, capacity) {
  const w = Number(weight) || 0;
  if (w <= 0) return 'none';
  if (w <= capacity.light)  return 'light';
  if (w <= capacity.medium) return 'medium';
  if (w <= capacity.heavy)  return 'heavy';
  return 'over';
}
