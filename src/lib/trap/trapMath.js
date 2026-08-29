/**
 * The arithmetic every other trap module leans on: reading a damage
 * expression, and the one piece of rounding the CR rules are specific about.
 */

/**
 * The average of a dice expression — `2d6`, `1d4+4`, `10d6`, or a flat `1`.
 *
 * A die of N faces averages (N+1)/2, so `2d6` is 7. Signs are honoured, so
 * `1d8-1` is 3.5.
 *
 * @param {string|number|null} expr
 * @returns {number}
 */
export function averageOf(expr) {
  if (expr === null || expr === undefined) return 0;
  const text = String(expr).replace(/\s+/g, '').toLowerCase();
  let total = 0;
  const term = /([+-]?)(\d*d\d+|\d+)/g;
  let match = term.exec(text);
  while (match) {
    const sign = match[1] === '-' ? -1 : 1;
    const body = match[2];
    if (body.includes('d')) {
      const [countRaw, facesRaw] = body.split('d');
      const count = countRaw ? Number(countRaw) : 1;
      total += sign * count * (Number(facesRaw) + 1) / 2;
    } else {
      total += sign * Number(body);
    }
    match = term.exec(text);
  }
  return total;
}

/**
 * The leading damage expression of a prose effect, or 0.
 *
 * A spell effect states its damage in dice — `8d6 fire`, `1d4+3 fire`. A bare
 * leading number is **not** damage: *earthquake*'s effect reads `65-ft.
 * radius`, and reading 65 points of damage out of it put that trap two CR
 * above the book's own answer.
 *
 * @param {string} text
 * @returns {number}
 */
export function leadingDamage(text) {
  const match = String(text ?? '').trim().match(/^\d*d\d+([+-]\d+)?/);
  return match ? averageOf(match[0]) : 0;
}

/**
 * Round average damage to the nearest multiple of 7 — the unit the CR rules
 * price damage in — rounding **up** on an exact tie.
 *
 * The tie rule is not decoration. Across the 105 sample traps, rounding an
 * exact tie up agrees with the book six more times than rounding it down.
 *
 * @param {number} average
 * @returns {{ rounded: number, cr: number }}
 */
export function damageToCR(average) {
  const avg = Number(average) || 0;
  if (avg <= 0) return { rounded: 0, cr: 0 };
  const low = Math.floor(avg / 7) * 7;
  const high = low + 7;
  const rounded = (avg - low) >= (high - avg) ? high : low;
  return { rounded, cr: rounded / 7 };
}

/** A gold figure as the app writes it elsewhere: grouped, no decimals. */
export function formatGp(value) {
  const n = Math.round(Number(value) || 0);
  return `${n.toLocaleString('en-US')} gp`;
}
