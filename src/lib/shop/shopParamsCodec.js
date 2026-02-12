/**
 * Bit-efficient encode/decode of (seed, shop params) and optional custom items for QR payload.
 * Params: 7 bytes. Optional custom block: 1 byte count + per item [1 byte nameLen, UTF-8 name, 1 byte number, 4 bytes price cents].
 * Lossless; name truncated to 255 UTF-8 bytes, number 1-99, price stored as integer cents.
 */

const VERSION = 2;
const PARAMS_BYTES_V1 = 7;
const PARAMS_BYTES_V2 = 8;
const BASE64URL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const MAX_NAME_BYTES = 255;
const PRICE_CENTS_MAX = 0xFFFFFFFF;

/** @typedef {{ seed: number; shopTypeIndex: number; level: number; cityLevel: number; playerLevel: number; reputation?: number; }} ShopParams */
/** @typedef {{ name: string; number: number; price: number; type?: string; }} CustomItem */

/** Item type string -> number for custom items in QR payload. Order is fixed; do not change. */
const CUSTOM_ITEM_TYPE_LIST = [
  'Good', 'Ammo', 'Weapon', 'Armor', 'Shield', 'Magic Weapon', 'Magic Armor',
  'Potion', 'Ring', 'Rod', 'Staff', 'Wand', 'Wondrous Item', 'Scroll', 'Custom'
];
const CUSTOM_ITEM_TYPE_TO_NUM = new Map(CUSTOM_ITEM_TYPE_LIST.map((t, i) => [t, i]));

function customItemTypeToNum(type) {
  const s = (type != null ? String(type).trim() : '') || 'Custom';
  return CUSTOM_ITEM_TYPE_TO_NUM.has(s) ? CUSTOM_ITEM_TYPE_TO_NUM.get(s) : CUSTOM_ITEM_TYPE_TO_NUM.get('Custom');
}

function numToCustomItemType(n) {
  const i = Math.max(0, Math.min((n | 0), CUSTOM_ITEM_TYPE_LIST.length - 1));
  return CUSTOM_ITEM_TYPE_LIST[i];
}

/**
 * Encode params to a minimal byte array. Seed is 32-bit. Reputation -10..10 in byte 8.
 * Bytes 0-6: as before. Byte 7: reputation + 10 (0..20).
 * @param {ShopParams} params
 * @returns {Uint8Array}
 */
export function encodeShopParams(params) {
  const shopTypeIndex = Math.max(0, Math.min(15, params.shopTypeIndex | 0));
  const level = Math.max(0, Math.min(15, params.level | 0));
  const cityLevel = Math.max(0, Math.min(7, params.cityLevel | 0));
  const playerLevel = Math.max(1, Math.min(127, params.playerLevel | 0));
  const seed = (params.seed >>> 0);
  const reputation = Math.max(-10, Math.min(10, params.reputation ?? 0));
  const repByte = Math.max(0, Math.min(20, reputation + 10));

  const b = new Uint8Array(8);
  b[0] = (VERSION << 4) | (shopTypeIndex & 0x0f);
  b[1] = (level << 4) | (cityLevel & 0x07);
  b[2] = (playerLevel & 0x7f);
  b[3] = (seed >>> 24) & 0xff;
  b[4] = (seed >>> 16) & 0xff;
  b[5] = (seed >>> 8) & 0xff;
  b[6] = seed & 0xff;
  b[7] = repByte & 0xff;
  return b;
}

/**
 * Decode byte array to ShopParams. Returns null if invalid or wrong version.
 * Bytes 0-6: params. Byte 7 optional: reputation (0..20) -> -10..10.
 * @param {Uint8Array} bytes
 * @returns {ShopParams | null}
 */
export function decodeShopParams(bytes) {
  if (!bytes || bytes.length < 7) return null;
  const v = (bytes[0] >>> 4) & 0x0f;
  if (v !== 1 && v !== 2) return null;

  const shopTypeIndex = bytes[0] & 0x0f;
  const level = (bytes[1] >>> 4) & 0x0f;
  const cityLevel = bytes[1] & 0x07;
  const playerLevel = Math.max(1, bytes[2] & 0x7f);
  const seed = (((bytes[3] << 24) | (bytes[4] << 16) | (bytes[5] << 8) | bytes[6]) >>> 0);
  const reputation = (v === 2 && bytes.length >= 8) ? (bytes[7] & 0xff) - 10 : 0;

  return { seed, shopTypeIndex, level, cityLevel, playerLevel, reputation };
}

/**
 * Encode to base64url string (no padding). Use for QR payload.
 * @param {ShopParams} params
 * @returns {string}
 */
export function encodeShopParamsToBase64Url(params) {
  const bytes = encodeShopParams(params);
  let s = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    s += BASE64URL_CHARS[a >>> 2];
    s += BASE64URL_CHARS[((a & 3) << 4) | (b >>> 4)];
    s += i + 1 < bytes.length ? BASE64URL_CHARS[((b & 15) << 2) | (c >>> 6)] : '';
    s += i + 2 < bytes.length ? BASE64URL_CHARS[c & 63] : '';
  }
  return s;
}

/**
 * Decode from base64url string.
 * @param {string} str
 * @returns {ShopParams | null}
 */
export function decodeShopParamsFromBase64Url(str) {
  if (!str || typeof str !== 'string') return null;
  const chars = str.replace(/[^A-Za-z0-9_-]/g, '');
  const n = chars.length;
  const byteLen = Math.floor((n * 3) / 4);
  if (byteLen < 7) return null;
  const bytes = new Uint8Array(byteLen);
  const lookup = new Map([...BASE64URL_CHARS].map((c, i) => [c, i]));
  let i = 0;
  let j = 0;
  while (j + 4 <= n) {
    const a = lookup.get(chars[j++]) ?? -1;
    const b = lookup.get(chars[j++]) ?? -1;
    const c = lookup.get(chars[j++]) ?? -1;
    const d = lookup.get(chars[j++]) ?? -1;
    if (a < 0 || b < 0 || c < 0 || d < 0) return null;
    bytes[i++] = (a << 2) | (b >>> 4);
    bytes[i++] = ((b & 15) << 4) | (c >>> 2);
    bytes[i++] = ((c & 3) << 6) | d;
  }
  if (j < n) {
    const a = lookup.get(chars[j++]) ?? -1;
    const b = lookup.get(chars[j++]) ?? -1;
    if (a >= 0 && b >= 0) bytes[i++] = (a << 2) | (b >>> 4);
    if (j < n) {
      const c = lookup.get(chars[j++]) ?? -1;
      if (c >= 0) bytes[i++] = ((b & 15) << 4) | (c >>> 2);
    }
  }
  return decodeShopParams(bytes.subarray(0, 7));
}

// --- Full payload (params + optional custom items) ---

const textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;

function stringToUtf8(str) {
  if (textEncoder) return textEncoder.encode(str);
  const s = String(str);
  const out = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c < 128) out.push(c);
    else if (c < 2048) { out.push(192 | (c >> 6)); out.push(128 | (c & 63)); }
    else if (c < 65536) { out.push(224 | (c >> 12)); out.push(128 | ((c >> 6) & 63)); out.push(128 | (c & 63)); }
    else { c -= 65536; out.push(240 | (c >> 18)); out.push(128 | ((c >> 12) & 63)); out.push(128 | ((c >> 6) & 63)); out.push(128 | (c & 63)); }
  }
  return new Uint8Array(out);
}

function utf8ToString(bytes) {
  if (textDecoder) return textDecoder.decode(bytes);
  const a = [];
  let i = 0;
  while (i < bytes.length) {
    const c = bytes[i++];
    if (c < 128) a.push(c);
    else if (c >= 192 && c < 224) a.push(((c & 31) << 6) | (bytes[i++] & 63));
    else if (c >= 224 && c < 240) a.push(((c & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63));
    else if (c >= 240) a.push(((c & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63));
    else a.push(c);
  }
  return String.fromCharCode(...a);
}

/**
 * Encode full payload: 7 bytes params + 1 byte custom count + [per custom: 1 byte nameLen, name UTF-8, 1 byte typeNum, 1 byte number, 4 bytes price cents BE].
 * @param {ShopParams} params
 * @param {CustomItem[]} customItems
 * @returns {Uint8Array}
 */
export function encodeShopPayload(params, customItems = []) {
  const head = encodeShopParams(params);
  const count = Math.min(255, customItems.length);
  let size = head.length + 1;
  const itemBytes = [];
  for (let k = 0; k < count; k++) {
    const item = customItems[k];
    const name = (item.name != null ? String(item.name) : '').trim() || 'Custom';
    let nameBytes = stringToUtf8(name);
    if (nameBytes.length > MAX_NAME_BYTES) nameBytes = nameBytes.subarray(0, MAX_NAME_BYTES);
    const typeNum = customItemTypeToNum(item.type);
    const num = Math.max(1, Math.min(99, (item.number | 0) || 1));
    const price = Math.max(0, Math.min(PRICE_CENTS_MAX, Math.round((Number(item.price) || 0) * 100)));
    itemBytes.push({ nameLen: nameBytes.length, nameBytes, typeNum, number: num, priceCents: price });
    size += 1 + nameBytes.length + 1 + 1 + 4;
  }
  const out = new Uint8Array(size);
  out.set(head, 0);
  out[head.length] = count;
  let off = head.length + 1;
  for (const t of itemBytes) {
    out[off++] = t.nameLen;
    out.set(t.nameBytes, off);
    off += t.nameLen;
    out[off++] = t.typeNum & 0xff;
    out[off++] = t.number;
    out[off++] = (t.priceCents >>> 24) & 0xff;
    out[off++] = (t.priceCents >>> 16) & 0xff;
    out[off++] = (t.priceCents >>> 8) & 0xff;
    out[off++] = t.priceCents & 0xff;
  }
  return out;
}

/**
 * Decode full payload. Supports 7-byte (params only, no reputation), 8-byte (params + reputation), or 9+ (params + custom count + items).
 * @param {Uint8Array} bytes
 * @returns {{ params: ShopParams, customItems: CustomItem[] } | null}
 */
export function decodeShopPayload(bytes) {
  if (!bytes || bytes.length < 7) return null;
  const v = (bytes[0] >>> 4) & 0x0f;
  const paramsLen = (v === 2 && bytes.length >= 8) ? PARAMS_BYTES_V2 : PARAMS_BYTES_V1;
  const params = decodeShopParams(bytes.subarray(0, paramsLen));
  if (!params) return null;
  const customItems = [];
  const customStart = paramsLen + 1;
  if (bytes.length >= customStart) {
    const count = bytes[paramsLen] & 0xff;
    let off = customStart;
    for (let k = 0; k < count && off + 7 <= bytes.length; k++) {
      const nameLen = bytes[off++] & 0xff;
      if (off + nameLen + 6 > bytes.length) break;
      const nameBytes = bytes.subarray(off, off + nameLen);
      off += nameLen;
      const typeNum = bytes[off++] & 0xff;
      const number = Math.max(1, Math.min(99, bytes[off++] || 1));
      const priceCents = ((bytes[off] << 24) | (bytes[off + 1] << 16) | (bytes[off + 2] << 8) | bytes[off + 3]) >>> 0;
      off += 4;
      customItems.push({
        name: utf8ToString(nameBytes),
        number,
        price: priceCents / 100,
        type: numToCustomItemType(typeNum),
      });
    }
  }
  return { params, customItems };
}

/**
 * Encode params and optional custom items to a single base64url string.
 */
export function encodeShopPayloadToBase64Url(params, customItems = []) {
  const bytes = encodeShopPayload(params, customItems);
  let s = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    s += BASE64URL_CHARS[a >>> 2];
    s += BASE64URL_CHARS[((a & 3) << 4) | (b >>> 4)];
    s += i + 1 < bytes.length ? BASE64URL_CHARS[((b & 15) << 2) | (c >>> 6)] : '';
    s += i + 2 < bytes.length ? BASE64URL_CHARS[c & 63] : '';
  }
  return s;
}

/**
 * Decode base64url string to { params, customItems }. Accepts both 7-byte (params only) and full payload.
 */
export function decodeShopPayloadFromBase64Url(str) {
  if (!str || typeof str !== 'string') return null;
  const chars = str.replace(/[^A-Za-z0-9_-]/g, '');
  const n = chars.length;
  const byteLen = Math.floor((n * 3) / 4);
  if (byteLen < 7) return null;
  const bytes = new Uint8Array(byteLen);
  const lookup = new Map([...BASE64URL_CHARS].map((c, i) => [c, i]));
  let i = 0;
  let j = 0;
  while (j + 4 <= n) {
    const a = lookup.get(chars[j++]) ?? -1;
    const b = lookup.get(chars[j++]) ?? -1;
    const c = lookup.get(chars[j++]) ?? -1;
    const d = lookup.get(chars[j++]) ?? -1;
    if (a < 0 || b < 0 || c < 0 || d < 0) return null;
    bytes[i++] = (a << 2) | (b >>> 4);
    bytes[i++] = ((b & 15) << 4) | (c >>> 2);
    bytes[i++] = ((c & 3) << 6) | d;
  }
  if (j < n) {
    const a = lookup.get(chars[j++]) ?? -1;
    const b = lookup.get(chars[j++]) ?? -1;
    if (a >= 0 && b >= 0) bytes[i++] = (a << 2) | (b >>> 4);
    if (j < n) {
      const c = lookup.get(chars[j++]) ?? -1;
      if (c >= 0) bytes[i++] = ((b & 15) << 4) | (c >>> 2);
    }
  }
  return decodeShopPayload(bytes.subarray(0, byteLen));
}
