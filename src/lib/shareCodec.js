/**
 * Pure encode/decode for shop share payloads (QR code).
 * Data model only; no I/O or resolution of ids to links.
 *
 * @typedef {{
 *   type: 2;
 *   name: string;
 *   number: number;
 *   price: number;
 * }} SharedEntryCustom
 *
 * @typedef {{
 *   type: 0;
 *   fileLetter: string;
 *   id: number;
 *   bonus: null | number;
 *   number: number;
 *   price: number;
 *   effectIds?: number[];
 *   displayName?: string;
 * }} SharedEntryRef
 *
 * @typedef {SharedEntryCustom | SharedEntryRef} SharedEntry
 *
 * @typedef {{
 *   version: string;
 *   name: string;
 *   gold: number;
 *   entries: SharedEntry[];
 * }} SharedPayload
 */

const DELIM = '|';
const VERSION = 'V2';
const NO_BONUS = '-';
/** Effect list prefix so decoder can tell "b|eList|..." from "b|N|p" when eList has one id. */
const EFFECT_LIST_PREFIX = ',';

/**
 * Encode a SharedPayload to the exact V2 wire string (no compression).
 * @param {SharedPayload} payload
 * @returns {string}
 */
export function encodeSharedPayload(payload) {
  if (!payload || !Array.isArray(payload.entries) || payload.entries.length === 0) return '';
  const name = (payload.name || '').toString();
  const gold = Math.floor(Number(payload.gold) || 0);
  const version = payload.version || VERSION;
  const parts = [version, String(name.length), name, String(gold)];

  parts.push(String(payload.entries.length));
  for (const entry of payload.entries) {
    parts.push(encodeEntry(entry));
  }
  return parts.join(DELIM);
}

/**
 * @param {SharedEntry} entry
 * @returns {string}
 */
function encodeEntry(entry) {
  if (entry.type === 2) {
    const n = (entry.name || 'Unknown').toString();
    return [2, n.length, n, entry.number, entry.price].join(DELIM);
  }
  if (entry.type === 0) {
    const bOrNo = entry.bonus == null ? NO_BONUS : String(entry.bonus);
    if (entry.effectIds && entry.effectIds.length > 0 && entry.displayName != null) {
      const eList = EFFECT_LIST_PREFIX + entry.effectIds.join(',');
      const n = entry.displayName.toString();
      return [0, entry.fileLetter, entry.id, entry.bonus, eList, n.length, n, entry.number, entry.price].join(DELIM);
    }
    return [0, entry.fileLetter, entry.id, bOrNo, entry.number, entry.price].join(DELIM);
  }
  return '';
}

/**
 * Decode a V2 wire string into a SharedPayload. Returns null if invalid.
 * @param {string} raw
 * @returns {SharedPayload | null}
 */
export function decodeSharedPayload(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const segments = raw.split(DELIM);
  if (segments.length < 5 || segments[0] !== VERSION) return null;
  let idx = 1;
  const nameLen = parseInt(segments[idx++], 10);
  if (isNaN(nameLen) || nameLen < 0) return null;
  const name = segments[idx++];
  if (name == null || name.length !== nameLen) return null;
  const gold = parseInt(segments[idx++], 10);
  const count = parseInt(segments[idx++], 10);
  if (isNaN(count) || count < 0) return null;

  const entries = [];
  for (let i = 0; i < count && idx < segments.length; i++) {
    const result = decodeEntry(segments, idx);
    if (!result) return null;
    entries.push(result.entry);
    idx = result.newIdx;
  }
  return { version: VERSION, name, gold, entries };
}

/**
 * @param {string[]} segments
 * @param {number} idx
 * @returns {{ entry: SharedEntry, newIdx: number } | null}
 */
function decodeEntry(segments, idx) {
  const t = parseInt(segments[idx++], 10);
  if (t === 2) {
    const _nameLen = parseInt(segments[idx++], 10);
    const name = segments[idx++];
    const N = parseInt(segments[idx++], 10) || 1;
    const p = parseFloat(segments[idx++]) || 0;
    return { entry: { type: 2, name: name || 'Unknown', number: N, price: p }, newIdx: idx };
  }
  if (t === 0) {
    const f = segments[idx++];
    const idNum = parseInt(segments[idx++], 10);
    const fourth = segments[idx];
    const nextSeg = segments[idx + 1];
    const isNoBonus = fourth === NO_BONUS;
    const isEffects = nextSeg != null && String(nextSeg).startsWith(EFFECT_LIST_PREFIX);
    if (isEffects && !isNoBonus) {
      const b = parseInt(segments[idx], 10);
      const eList = segments[idx + 1];
      const _nameLen3 = parseInt(segments[idx + 2], 10);
      const name3 = segments[idx + 3];
      const N3 = parseInt(segments[idx + 4], 10) || 1;
      const p3 = parseFloat(segments[idx + 5]) || 0;
      idx += 6;
      const effectIds = eList.slice(1).split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
      return {
        entry: { type: 0, fileLetter: f, id: idNum, bonus: b, number: N3, price: p3, effectIds, displayName: name3 || '' },
        newIdx: idx,
      };
    }
    if (isNoBonus) {
      const N0 = parseInt(segments[idx + 1], 10) || 1;
      const p0 = parseFloat(segments[idx + 2]) || 0;
      idx += 3;
      return {
        entry: { type: 0, fileLetter: f, id: idNum, bonus: null, number: N0, price: p0 },
        newIdx: idx,
      };
    }
    const b = parseInt(segments[idx], 10);
    const N2 = parseInt(segments[idx + 1], 10) || 1;
    const p2 = parseFloat(segments[idx + 2]) || 0;
    idx += 3;
    return {
      entry: { type: 0, fileLetter: f, id: idNum, bonus: b, number: N2, price: p2 },
      newIdx: idx,
    };
  }
  return null;
}

export { DELIM, VERSION, NO_BONUS, EFFECT_LIST_PREFIX };
