/**
 * Storage compression: enum lookups and scaled numbers.
 * Enums and scaling factors; resolve at runtime from tables.json Enums.
 */
import { loadFile } from './utils';

const GOLD_SCALE = 100;
const PERCENT_SCALE = 100;
const MOD_SCALE = 100;

let _enums = null;
function getEnums() {
    if (_enums) return _enums;
    const tables = loadFile('tables');
    _enums = tables && tables.Enums ? tables.Enums : {};
    return _enums;
}

export function strToEnum(enumKey, str) {
    if (str == null || str === '') return -1;
    const arr = getEnums()[enumKey];
    if (!Array.isArray(arr)) return -1;
    const i = arr.indexOf(str);
    return i >= 0 ? i : -1;
}

export function enumToStr(enumKey, num) {
    const arr = getEnums()[enumKey];
    if (!Array.isArray(arr)) return '';
    const n = Number(num);
    if (isNaN(n) || n < 0 || n >= arr.length) return '';
    return arr[n] || '';
}

export { GOLD_SCALE, PERCENT_SCALE, MOD_SCALE };

export function scaleGold(g) {
    const v = Number(g);
    if (isNaN(v)) return 0;
    return Math.round(v * GOLD_SCALE);
}

export function unscaleGold(n) {
    const v = Number(n);
    if (isNaN(v)) return 0;
    if (v > 1e10 || v < -1e10) return v;
    return v / GOLD_SCALE;
}

export function scalePercent(p) {
    const v = Number(p);
    if (isNaN(v)) return 0;
    return Math.round(v * PERCENT_SCALE);
}

export function unscalePercent(n) {
    const v = Number(n);
    if (isNaN(v)) return 0;
    return v / PERCENT_SCALE;
}

export function scaleMod(m) {
    const v = Number(m);
    if (isNaN(v)) return 100;
    return Math.round(v * MOD_SCALE);
}

export function unscaleMod(n) {
    const v = Number(n);
    if (isNaN(v)) return 1;
    return v / MOD_SCALE;
}

/** Parse legacy "yy/mm/dd hh:mm:ss" or return unix if number. */
export function timestampToUnix(val) {
    if (val == null) return Math.floor(Date.now() / 1000);
    if (typeof val === 'number' && !isNaN(val)) return Math.floor(val);
    if (typeof val !== 'string') return Math.floor(Date.now() / 1000);
    const m = val.match(/^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (!m) return Math.floor(Date.now() / 1000);
    const y = 2000 + parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    const h = parseInt(m[4], 10);
    const min = parseInt(m[5], 10);
    const s = parseInt(m[6], 10);
    const date = new Date(y, month, d, h, min, s);
    return Math.floor(date.getTime() / 1000);
}

/** Format unix timestamp for UI (compact). */
export function unixToDisplay(unix) {
    const n = Number(unix);
    if (isNaN(n) || n <= 0) return '';
    const d = new Date(n * 1000);
    const pad = x => String(x).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(2);
    return `${yy}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
