/**
 * Generic slug: lowercase, trim, spaces to hyphens.
 * Used for feat anchors, skill anchors, and link path segments.
 */
export function slug(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Parse a path link like "items/Weapon/longsword" or "scrolls/Arcane/acid-splash".
 * Returns { parts: string[], slug: string } where slug is the last segment or the full link if no slash.
 */
export function parsePath(link) {
  if (!link || typeof link !== 'string') return { parts: [], slug: '' };
  const parts = link.split('/').map(p => p.trim()).filter(Boolean);
  const slugPart = parts.length > 0 ? parts[parts.length - 1] : link;
  return { parts, slug: slugPart };
}
