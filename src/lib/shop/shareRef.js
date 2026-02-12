/**
 * Compact share ref: (fileCode, id) instead of full link for QR payload.
 * ShareFileMap in data/tables.json: "i" -> "items", "s" -> "scrolls".
 * Items and scrolls use numeric id from their JSON (item.id, scroll.id or global index).
 */
import { loadFile } from '../loadFile';
import { getItemByRef, getItemById, getItemIdByRef } from '../utils';

function getShareFileMap() {
  const tables = loadFile('tables');
  return (tables && tables.ShareFileMap) || { i: 'items', s: 'scrolls' };
}

function getFileCodeByFileName(fileName) {
  const map = getShareFileMap();
  for (const [code, name] of Object.entries(map)) {
    if (name === fileName) return code;
  }
  return null;
}

/**
 * Get (fileCode, id) for a link, for use in QR. Returns null if link is not from a shareable file.
 */
export function getShareFileCodeAndId(link) {
  if (!link || typeof link !== 'string') return null;
  const parts = link.split('/').map(p => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const file = parts[0];
  if (file === 'items') {
    const id = getItemIdByRef(link);
    if (id == null || typeof id !== 'number') return null;
    const code = getFileCodeByFileName('items');
    return code ? { fileCode: code, id } : null;
  }
  if (file === 'scrolls') {
    const globalId = getScrollGlobalIdByLink(link);
    if (globalId == null) return null;
    const code = getFileCodeByFileName('scrolls');
    return code ? { fileCode: code, id: globalId } : null;
  }
  return null;
}

/** Scrolls: global id = Arcane indices 0..n-1, then Divine n..n+m-1. */
function getScrollGlobalIdByLink(link) {
  const scrollsData = loadFile('scrolls');
  if (!scrollsData) return null;
  const arcane = scrollsData.Arcane || [];
  const divine = scrollsData.Divine || [];
  const parts = link.split('/').map(p => p.trim()).filter(Boolean);
  if (parts.length < 3 || parts[0] !== 'scrolls') return null;
  const source = parts[1];
  const slug = parts[2];
  if (source === 'Arcane') {
    const idx = arcane.findIndex(s => s && s.Link === slug);
    return idx >= 0 ? idx : null;
  }
  if (source === 'Divine') {
    const idx = divine.findIndex(s => s && s.Link === slug);
    return idx >= 0 ? arcane.length + idx : null;
  }
  return null;
}

/** Get scroll by global id (Arcane then Divine). */
function getScrollByGlobalId(globalId) {
  const scrollsData = loadFile('scrolls');
  if (!scrollsData || typeof globalId !== 'number' || globalId < 0) return null;
  const arcane = scrollsData.Arcane || [];
  const divine = scrollsData.Divine || [];
  if (globalId < arcane.length) {
    const scroll = arcane[globalId];
    return scroll ? { scroll, source: 'Arcane' } : null;
  }
  const divIdx = globalId - arcane.length;
  if (divIdx < divine.length) {
    const scroll = divine[divIdx];
    return scroll ? { scroll, source: 'Divine' } : null;
  }
  return null;
}

/**
 * Resolve (fileCode, id) to full link. Returns null if invalid.
 */
export function getLinkByShareRef(fileCode, id) {
  if (fileCode == null || id == null || typeof id !== 'number' || id < 0) return null;
  const map = getShareFileMap();
  const fileName = map[String(fileCode)];
  if (!fileName) return null;
  if (fileName === 'items') {
    const result = getItemById(id);
    if (!result || !result.item) return null;
    return `items/${result.itemType}/${result.item.Link}`;
  }
  if (fileName === 'scrolls') {
    const result = getScrollByGlobalId(id);
    if (!result) return null;
    return `scrolls/${result.source}/${result.scroll.Link}`;
  }
  return null;
}

/**
 * Resolve (fileCode, id) to { raw, source } like getItemByRef(link). For display/cost.
 */
export function getRefByShareRef(fileCode, id) {
  const link = getLinkByShareRef(fileCode, id);
  if (!link) return null;
  return getItemByRef(link);
}
