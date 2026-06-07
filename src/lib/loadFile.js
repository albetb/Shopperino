import items from '../data/items.json';
import scrolls from '../data/scrolls.json';
import tables from '../data/tables.json';
import spells from '../data/spells.json';
import featsData from '../data/feats.json';
import skillsData from '../data/skills.json';
import racesData from '../data/races.json';
import classesData from '../data/classes.json';
import animalsData from '../data/animals.json';
import companionAbilitiesData from '../data/companionAbilities.json';

/**
 * Load a data file by name. Returns the parsed content or null.
 * Supported: 'items' | 'scrolls' | 'tables' | 'spells' | 'feats' | 'skills' | 'races' | 'classes' | 'animals'
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
      case 'races':
        return racesData?.races ?? {};
      case 'classes':
        return classesData?.classes ?? {};
      case 'animals':
        return animalsData ?? { animals: [] };
      case 'companionabilities':
        return companionAbilitiesData ?? {};
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}
