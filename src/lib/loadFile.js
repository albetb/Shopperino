import items from '../data/items.json';
import scrolls from '../data/scrolls.json';
import tables from '../data/tables.json';
import spells from '../data/spells.json';
import featsData from '../data/feats.json';
import skillsData from '../data/skills.json';

/**
 * Load a data file by name. Returns the parsed content or null.
 * Supported: 'items' | 'scrolls' | 'tables' | 'spells' | 'feats' | 'skills'
 */
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
        return null;
    }
  } catch (error) {
    return null;
  }
}
