import { loadFile } from './loadFile';
import { slug } from './slugUtils';

export { loadFile };
export { itemTypes, getItemByRef, getItemByLink, getItemById, getItemIdByRef } from './itemsUtils';
export { getScrollById, getScrollIdByLink } from './scrollUtils';
export { getEffectByLink, getEffectById, getEffectIdBySlug } from './effectsUtils';
export { getSpellByLink } from './spellsUtils';

const CHARACTERISTIC_FULL = { Str: 'Strength', Dex: 'Dexterity', Con: 'Constitution', Int: 'Intelligence', Wis: 'Wisdom', Cha: 'Charisma', None: 'None' };

/** Returns a card for the info sidebar when link is a feat anchor. */
export function getFeatByLink(link) {
  try {
    const feats = loadFile('feats');
    if (!Array.isArray(feats) || !link || typeof link !== 'string') return [];
    const normalized = link.toLowerCase().trim();
    const feat = feats.find(f => slug(f.Name) === normalized);
    if (!feat) return [];
    const tagsLine = Array.isArray(feat.Tags) && feat.Tags.length ? '<p><i>' + feat.Tags.join(', ') + '</i></p>' : '';
    const prereqLine = feat.Prerequisites ? '<p><b>Prerequisites:</b> ' + feat.Prerequisites + '</p>' : '';
    const description = (tagsLine + prereqLine + (feat.Description || '')).trim();
    return [{ Name: feat.Name, Description: description, Link: normalized }];
  } catch (err) {
    return [];
  }
}

/** Returns a card for the info sidebar when link is a skill anchor. */
export function getSkillByLink(link) {
  try {
    const skills = loadFile('skills');
    if (!Array.isArray(skills) || !link || typeof link !== 'string') return [];
    const normalized = link.toLowerCase().trim();
    const skill = skills.find(s => slug(s.Name) === normalized);
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

/** Returns a card for the info sidebar when link is a condition anchor. */
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

/** Optional rng: { nextFloat() } for deterministic choice. */
export function weightedRandom(weights, rng) {
  const totalWeight = weights.reduce((acc, val) => acc + val, 0);
  const randomNum = rng ? rng.nextFloat() * totalWeight : Math.random() * totalWeight;
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (randomNum <= sum) return i;
  }
}

export function cap(string) {
  if (typeof string !== 'string' || string.length === 0) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function shopTypes() {
  const tables = loadFile('tables');
  return tables['Shop Types'].map(item => item.Name);
}

export function isMobile() {
  return window.innerWidth <= 760;
}

/** Format a number with thousands separator (') and optional decimals (e.g. 1'234.5). */
export function formatNumber(num) {
  const n = parseFloat(num);
  if (isNaN(n)) return '0';
  const [intPart, decPart] = n.toFixed(2).split('.');
  const sep = "'";
  const rev = intPart.split('').reverse().join('');
  const fmtInt = rev.match(/.{1,3}/g).join(sep).split('').reverse().join('');
  let decimals = '';
  if (decPart !== '00') {
    if (decPart[1] === '0') decimals = `.${decPart[0]}`;
    else decimals = `.${decPart}`;
  }
  return `${fmtInt}${decimals}`;
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
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

export function serialize(obj) {
  return obj && typeof obj.serialize === 'function' ? obj.serialize() : obj;
}
