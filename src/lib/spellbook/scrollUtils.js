import { loadFile } from '../loadFile';

const SCROLL_SOURCES = ['Arcane', 'Divine'];

/** Get scroll by global id (Arcane then Divine). Returns { scroll, source } or null. */
export function getScrollById(id) {
  const scrollsData = loadFile('scrolls');
  if (!scrollsData || typeof id !== 'number' || id < 0) return null;
  for (const source of SCROLL_SOURCES) {
    const arr = scrollsData[source];
    if (!Array.isArray(arr)) continue;
    for (const scroll of arr) {
      if (scroll && typeof scroll === 'object' && scroll.id === id)
        return { scroll, source };
    }
  }
  return null;
}

/** Get global scroll id from link "scrolls/Arcane|Divine/slug". Returns number or null. */
export function getScrollIdByLink(link) {
  if (!link || typeof link !== 'string') return null;
  const parts = link.split('/').map(p => p.trim()).filter(Boolean);
  if (parts.length < 3 || parts[0] !== 'scrolls') return null;
  const source = parts[1];
  const slugPart = parts[2];
  if (source !== 'Arcane' && source !== 'Divine') return null;
  const scrollsData = loadFile('scrolls');
  const arr = scrollsData[source];
  if (!Array.isArray(arr)) return null;
  const scroll = arr.find(s => s && s.Link === slugPart);
  return scroll && typeof scroll.id === 'number' ? scroll.id : null;
}
