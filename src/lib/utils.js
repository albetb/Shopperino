import items from '../data/items.json';
import scrolls from '../data/scrolls.json';
import tables from '../data/tables.json';
import spells from '../data/spells.json';
import featsData from '../data/feats.json';
import skillsData from '../data/skills.json';

export const itemTypes = [
    'Ammo',
    'Armor',
    'Good',
    'Magic Armor',
    'Magic Weapon',
    'Potion',
    'Ring',
    'Rod',
    'Scroll',
    'Shield',
    'Staff',
    'Wand',
    'Weapon',
    'Wondrous Item'
];

export function loadFile(fileName) {
    try {
        switch (fileName.toLowerCase()) {
            case 'items':
                return items;
            case 'scrolls':
                return scrolls;
            case 'tables':
                return tables;
            case 'spells':
                return spells;
            case 'feats':
                return featsData?.Feats || [];
            case 'skills':
                return skillsData?.Skills || [];
            default:
                return null
        }
    } catch (error) {
        return null;
    }
}

/** Resolve a spell by link (anchor). Searches only in the complete spells.json. */
export function getSpellByLink(link) {
    try {
        const spells = loadFile('spells');
        const spell = spells.find(s => s.Link === link);
        return spell ? [spell] : [];
    } catch (err) {
        return [];
    }
}

/** Slug for feat href: lowercase, spaces to hyphens. */
function featSlug(name) {
    if (!name || typeof name !== 'string') return '';
    return name.toLowerCase().trim().replace(/\s+/g, '-');
}

/** Returns a card for the info sidebar when link is a feat anchor (e.g. "endurance", "armor-proficiency-(heavy)"). */
export function getFeatByLink(link) {
    try {
        const feats = loadFile('feats');
        if (!Array.isArray(feats) || !link || typeof link !== 'string') return [];
        const normalized = link.toLowerCase().trim();
        const feat = feats.find(f => featSlug(f.Name) === normalized);
        if (!feat) return [];
        const tagsLine = Array.isArray(feat.Tags) && feat.Tags.length
            ? '<p><i>' + feat.Tags.join(', ') + '</i></p>'
            : '';
        const prereqLine = feat.Prerequisites
            ? '<p><b>Prerequisites:</b> ' + feat.Prerequisites + '</p>'
            : '';
        const description = (tagsLine + prereqLine + (feat.Description || '')).trim();
        return [{ Name: feat.Name, Description: description, Link: normalized }];
    } catch (err) {
        return [];
    }
}

/** Slug for skill href: lowercase, spaces to hyphens. */
function skillSlug(name) {
    if (!name || typeof name !== 'string') return '';
    return name.toLowerCase().trim().replace(/\s+/g, '-');
}

const CHARACTERISTIC_FULL = { Str: 'Strength', Dex: 'Dexterity', Con: 'Constitution', Int: 'Intelligence', Wis: 'Wisdom', Cha: 'Charisma', None: 'None' };

/** Returns a card for the info sidebar when link is a skill anchor (e.g. "spellcraft", "sleight-of-hand"). */
export function getSkillByLink(link) {
    try {
        const skills = loadFile('skills');
        if (!Array.isArray(skills) || !link || typeof link !== 'string') return [];
        const normalized = link.toLowerCase().trim();
        const skill = skills.find(s => skillSlug(s.Name) === normalized);
        if (!skill) return [];
        const charFull = (skill.Characteristic && CHARACTERISTIC_FULL[skill.Characteristic]) ? CHARACTERISTIC_FULL[skill.Characteristic] : (skill.Characteristic || '');
        const italicParts = [charFull, skill.Note].filter(Boolean);
        const italicLine = italicParts.length ? '<p><i>' + italicParts.join(' — ') + '</i></p>' : '';
        const description = (italicLine + (skill.Description || '')).trim();
        return [{ Name: skill.Name, Description: description, Link: normalized }];
    } catch (err) {
        return [];
    }
}

/** Returns a card for the info sidebar when link is a condition anchor (e.g. "dazed", "flat-footed"). */
export function getConditionByLink(link) {
    try {
        const data = loadFile('tables');
        const conditions = data?.Conditions;
        if (!conditions || typeof link !== 'string' || !link.trim()) return [];
        const normalized = link.toLowerCase().trim().replace(/\s+/g, '-');
        const keyToSlug = k => k.toLowerCase().replace(/\s+/g, '-');
        let entry = Object.entries(conditions).find(([k]) => keyToSlug(k) === normalized);
        if (!entry && normalized === 'deafend') {
            entry = Object.entries(conditions).find(([k]) => k === 'Deafened');
        }
        if (!entry) return [];
        const [name, description] = entry;
        return [{ Name: name, Description: description || '', Link: link }];
    } catch (err) {
        return [];
    }
}

/**
 * Resolve item or scroll by reference link: "items/ItemType/slug" or "scrolls/Arcane|Divine/slug".
 * Returns { raw, source: 'items'|'scrolls' } or null.
 */
export function getItemByRef(link) {
  if (!link || typeof link !== 'string') return null;
  const parts = link.split('/');
  if (parts.length < 3) return null;
  const [source, typeOrSub, slug] = parts;
  if (source === 'items') {
    const items = loadFile('items');
    const list = items[typeOrSub] || [];
    let raw = list.find(item => item.Link === slug) || null;
    if (!raw) {
      const types = [
        'Good', 'Ammo', 'Weapon', 'Specific Weapon', 'Armor',
        'Specific Armor', 'Shield', 'Specific Shield', 'Potion',
        'Ring', 'Rod', 'Staff', 'Wand', 'Wondrous Item'
      ];
      const allItems = types.flatMap(type => items[type] || []);
      raw = allItems.find(item => item.Link === slug) || null;
    }
    return raw ? { raw, source: 'items' } : null;
  }
  if (source === 'scrolls' && (typeOrSub === 'Arcane' || typeOrSub === 'Divine')) {
    const scrolls = loadFile('scrolls');
    const list = scrolls[typeOrSub] || [];
    const raw = list.find(s => s.Link === slug) || null;
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
      const types = [
        "Good", "Ammo", "Weapon", "Specific Weapon", "Armor",
        "Specific Armor", "Shield", "Specific Shield", "Potion",
        "Ring", "Rod", "Staff", "Wand", "Wondrous Item"
      ];
      const allItems = types.flatMap(type => items[type] || []);
      const slug = isPathLink ? (link.split('/').pop() || link) : link;
      found = allItems.find(item => item.Link === slug) || null;
    }
    if (!found) {
      const scrolls = loadFile('scrolls');
      const slug = isPathLink ? (link.split('/').pop() || link) : link;
      for (const sub of ['Arcane', 'Divine']) {
        found = (scrolls[sub] || []).find(s => s.Link === slug) || null;
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

    // strip out unused props (items)
    const { Minor, Medium, Major, Chance, Id, Type, Cost, ...card } = found;

    // unit‑suffix normalization
    if (typeof card.Weight === 'number') card.Weight = card.Weight + ' kg';
    if (typeof card.Range === 'number') card.Range  = card.Range === 0 ? '—' : card.Range + ' ft.';

    if (bonus === -1) {
      // perfect
      if (card["Armor Check Penalty"]) {
        card["Armor Check Penalty"] += ' (+1)';
      }
      card.Name += ', perfect';
      if ((card["Dmg (S)"] || card["Dmg (M)"]) && !card["Armor/Shield Bonus"]) {
        const desc = card.Description ? card.Description : "";
        card.Description = "<p><i>+1 to attack rolls when used in combat.</i></p>" + desc;
      }
    } else if (bonus > 0) {
      // +bonus
      if (card["Dmg (S)"] && !card["Armor/Shield Bonus"]) {
        card["Dmg (S)"] += ` (+${bonus})`;
      }
      if (card["Dmg (M)"] && !card["Armor/Shield Bonus"]) {
        card["Dmg (M)"] += ` (+${bonus})`;
      }
      if (card["Armor/Shield Bonus"]) {
        card["Armor/Shield Bonus"] += ` (+${bonus})`;
      }
      if (card["Armor Check Penalty"] && parseInt(card["Armor Check Penalty"], 10) < 0) {
        card["Armor Check Penalty"] += ' (+1)';
      }
      if (card["Dmg (S)"] || card["Dmg (M)"] || card["Armor/Shield Bonus"]) {
        card.Name += ` +${bonus}`;
      }
      if ((card["Dmg (S)"] || card["Dmg (M)"]) && !card["Armor/Shield Bonus"]) {
        const desc = card.Description ? card.Description : "";
        card.Description = `<p><i>+${bonus} to attack rolls when used in combat.</i></p>` + desc;
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

export function getEffectByLink(link) {
    try {
        const types = ["Magic Melee Weapon", "Magic Ranged Weapon", "Magic Shield", "Magic Armor"];

        const effectsRaw = loadFile('tables');
        const effects = types.flatMap(type => effectsRaw[type] || []);

        const found = effects.find(item => item.Link === link);
        if (!found) return [];

        const { Minor, Medium, Major, "Cost Modifier": costModifier, ...cleaned } = found;

        return cleaned;
    } catch (err) {
        return null;
    }
}

export function weightedRandom(weights) {
    const totalWeight = weights.reduce((acc, val) => acc + val, 0);
    const randomNum = Math.random() * totalWeight;
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
        sum += weights[i];
        if (randomNum <= sum) {
            return i;
        }
    }
}

export function cap(string) {
    if (typeof string !== 'string' || string.length === 0)
        return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function shopTypes() {
    const tables = loadFile('tables');
    return tables['Shop Types'].map(item => item.Name);
}

export function isMobile() {
    const isMobile = (window.innerWidth <= 760);
    return isMobile
}

export function trimLine(string, endLine = 11) {
    if (string) {
        const dot = string.length > endLine ? '…' : '';
        return `${string.slice(0, endLine)}${dot}`;
    }
    return string;
}

export function order(list, element) {
    if (list != null && list.length > 0) {
        list = list.filter(item => item !== element);
        list.sort();
        return [element].concat(list);
    }
    return [];
}

export function newGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
}

export function serialize(obj) {
    return obj && typeof obj.serialize === 'function'
        ? obj.serialize()
        : obj;
}
