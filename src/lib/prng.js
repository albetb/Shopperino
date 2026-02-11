/**
 * Deterministic PRNG (SFC32) for cross-engine identical output.
 * No Math.random(); integer-only state; nextFloat derived from nextUint32.
 * Use for generateShop(seed, params) so QR payload can be seed + params only.
 */

const U32_MAX = 0x100000000; // 2^32, exact in IEEE 754 double

/**
 * Create SFC32 state from one 32-bit seed. Expands to 128-bit state via mixing.
 * @param {number} seed - 32-bit unsigned (0 .. 2^32-1). Use (seed >>> 0) to ensure.
 * @returns {[number, number, number, number]} - [a, b, c, d] for SFC32
 */
function seedFrom32(seed) {
  let s = (seed >>> 0) || 1;
  const a = (s ^ (s >>> 16)) >>> 0;
  s = Math.imul(s, 0x85ebca6b);
  const b = (s ^ (s >>> 13)) >>> 0;
  s = Math.imul(s, 0xc2b2ae35);
  const c = (s ^ (s >>> 16)) >>> 0;
  s = Math.imul(s, 0x27d4eb2d);
  const d = (s ^ (s >>> 15)) >>> 0;
  return [a, b, c, d];
}

/**
 * Create SFC32 state from two 32-bit seeds (64-bit seed space).
 * @param {number} seedLo - low 32 bits
 * @param {number} seedHi - high 32 bits
 * @returns {[number, number, number, number]}
 */
function seedFrom64(seedLo, seedHi) {
  const lo = (seedLo >>> 0) || 1;
  const hi = (seedHi >>> 0) || 0;
  const a = (lo ^ (hi >>> 16)) >>> 0;
  const b = (hi ^ (lo >>> 13)) >>> 0;
  const c = (Math.imul(lo, 0x85ebca6b) ^ (hi >>> 16)) >>> 0;
  const d = (Math.imul(hi, 0xc2b2ae35) ^ (lo >>> 15)) >>> 0;
  return [a, b, c, d];
}

/**
 * SFC32 step. Returns next 32-bit unsigned and updates state in place.
 * @param {[number, number, number, number]} state - [a, b, c, d]
 * @returns {number} 0 .. 2^32-1
 */
function sfc32Next(state) {
  let [a, b, c, d] = state;
  const t = (a + b) | 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) | 0;
  c = (c << 21) | (c >>> 11);
  c = (c + d) | 0;
  d = (d + 1) | 0;
  state[0] = a;
  state[1] = b;
  state[2] = c;
  state[3] = d;
  return (t >>> 0);
}

/**
 * Create a deterministic PRNG instance.
 * @param {number | [number, number]} seed - 32-bit number or [seedLo, seedHi] for 64-bit
 * @returns {{ nextUint32(): number, nextFloat(): number }}
 */
export function createPrng(seed) {
  const state = Array.isArray(seed)
    ? seedFrom64(seed[0], seed[1])
    : seedFrom32(typeof seed === 'number' ? seed : 0);

  return {
    /** Returns value in [0, 2^32 - 1]. */
    nextUint32() {
      return sfc32Next(state);
    },
    /** Returns value in [0, 1). Deterministic: u32 / 2^32. */
    nextFloat() {
      const u = sfc32Next(state);
      return u / U32_MAX;
    },
  };
}

export { seedFrom32, seedFrom64, sfc32Next };
