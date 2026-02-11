import { loadFile } from './loadFile';
import { getSpellByLink } from './spellsUtils';

export const itemTypes = [
  'Ammo', 'Armor', 'Good', 'Magic Armor', 'Magic Weapon', 'Potion',
  'Ring', 'Rod', 'Scroll', 'Shield', 'Staff', 'Wand', 'Weapon', 'Wondrous Item'
];

/** Canonical order for item lookup in items.json. */
const ITEM_TYPES = [
  'Good', 'Ammo', 'Weapon', 'Specific Weapon', 'Armor', 'Specific Armor',
  'Shield', 'Specific Shield', 'Potion', 'Ring', 'Rod', 'Staff', 'Wand', 'Wondrous Item'
];

function findItemBySlug(items, slug) {
  const allItems = ITEM_TYPES.flatMap(type => items[type] || []);
  return allItems.find(item => item && item.Link === slug) || null;
}

/**
 * Resolve item or scroll by reference link: "items/ItemType/slug" or "scrolls/Arcane|Divine/slug".
 * Returns { raw, source: 'items'|'scrolls' } or null.
 */
export function getItemByRef(link) {
  if (!link || typeof link !== 'string') return null;
  const parts = link.split('/').map(p => p.trim()).filter(Boolean);
  const slugPart = parts.length > 0 ? parts[parts.length - 1] : link;

  if (parts.length < 3) {
    const items = loadFile('items');
    const raw = findItemBySlug(items, slugPart);
    return raw ? { raw, source: 'items' } : null;
  }

  const [source, typeOrSub, slugFromPath] = parts;
  const effectiveSlug = slugFromPath || slugPart;
  if (source === 'items') {
    const items = loadFile('items');
    const list = items[typeOrSub] || [];
    let raw = list.find(item => item && item.Link === effectiveSlug) || null;
    if (!raw) raw = findItemBySlug(items, effectiveSlug);
    return raw ? { raw, source: 'items' } : null;
  }
  if (source === 'scrolls' && (typeOrSub === 'Arcane' || typeOrSub === 'Divine')) {
    const scrollsData = loadFile('scrolls');
    const list = scrollsData[typeOrSub] || [];
    const raw = list.find(s => s && s.Link === effectiveSlug) || null;
    return raw ? { raw, source: 'scrolls' } : null;
  }
  return null;
}

export function getItemByLink(link, bonus = 0) {
  try {
    const isPathLink = typeof link === 'string' && link.includes('/');
    let found = null;
    let refSource = null;
    if (isPathLink) {
      const refResult = getItemByRef(link);
      if (refResult) {
        found = refResult.raw;
        refSource = refResult.source;
      }
    }
    if (!found) {
      const items = loadFile('items');
      const allItems = ITEM_TYPES.flatMap(type => items[type] || []);
      const slugPart = isPathLink ? (link.split('/').pop() || link) : link;
      found = allItems.find(item => item.Link === slugPart) || null;
    }
    if (!found) {
      const scrollsData = loadFile('scrolls');
      const slugPart = isPathLink ? (link.split('/').pop() || link) : link;
      for (const sub of ['Arcane', 'Divine']) {
        found = (scrollsData[sub] || []).find(s => s.Link === slugPart) || null;
        if (found) {
          refSource = 'scrolls';
          break;
        }
      }
    }
    if (!found) return [];

    if (refSource === 'scrolls') {
      const { Chance, ...scrollCard } = found;
      const spellCards = getSpellByLink(found.Link);
      const spellName = spellCards.length ? spellCards[0].Name : (found.Name || '').replace(/^Scroll of /i, '').trim();
      const spellLink = `<a href="spells#${found.Link}">${spellName}</a>`;
      const description = `<p>Contains the spell: ${spellLink}.</p><p><b>Spell level:</b> ${found.Level ?? '—'}</p>`;
      return [{ ...scrollCard, Link: found.Link, Description: description }];
    }

    const { Minor, Medium, Major, Chance, Id, Type, Cost, ...card } = found;
    if (typeof card.Weight === 'number') card.Weight = card.Weight + ' kg';
    if (typeof card.Range === 'number') card.Range = card.Range === 0 ? '—' : card.Range + ' ft.';

    if (bonus === -1) {
      if (card['Armor Check Penalty']) card['Armor Check Penalty'] += ' (+1)';
      card.Name += ', perfect';
      if ((card['Dmg (S)'] || card['Dmg (M)']) && !card['Armor/Shield Bonus']) {
        card.Description = '<p><i>+1 to attack rolls when used in combat.</i></p>' + (card.Description || '');
      }
    } else if (bonus > 0) {
      if (card['Dmg (S)'] && !card['Armor/Shield Bonus']) card['Dmg (S)'] += ` (+${bonus})`;
      if (card['Dmg (M)'] && !card['Armor/Shield Bonus']) card['Dmg (M)'] += ` (+${bonus})`;
      if (card['Armor/Shield Bonus']) card['Armor/Shield Bonus'] += ` (+${bonus})`;
      if (card['Armor Check Penalty'] && parseInt(card['Armor Check Penalty'], 10) < 0) card['Armor Check Penalty'] += ' (+1)';
      if (card['Dmg (S)'] || card['Dmg (M)'] || card['Armor/Shield Bonus']) card.Name += ` +${bonus}`;
      if ((card['Dmg (S)'] || card['Dmg (M)']) && !card['Armor/Shield Bonus']) {
        card.Description = `<p><i>+${bonus} to attack rolls when used in combat.</i></p>` + (card.Description || '');
      }
    }

    if (card.Link) {
      const spellCards = getSpellByLink(card.Link);
      if (spellCards.length) {
        const spellLink = `<a href="spells#${card.Link}">${spellCards[0].Name}</a>`;
        card.Description = (card.Description || '') + `<p>Contains the spell: ${spellLink}.</p>`;
      }
    }
    return [card];
  } catch (err) {
    return [];
  }
}

/** Get item by global id. Returns { item, itemType } or null. */
export function getItemById(id) {
  const items = loadFile('items');
  if (!items || typeof id !== 'number' || id < 0) return null;
  for (const itemType of ITEM_TYPES) {
    const arr = items[itemType];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (item && typeof item === 'object' && item.id === id)
        return { item, itemType };
    }
  }
  return null;
}

/** Get global item id from link "items/ItemType/slug" or slug. Returns number or null. */
export function getItemIdByRef(link) {
  if (!link || typeof link !== 'string') return null;
  const ref = getItemByRef(link);
  if (!ref || !ref.raw) return null;
  const id = ref.raw.id;
  return typeof id === 'number' ? id : null;
}
