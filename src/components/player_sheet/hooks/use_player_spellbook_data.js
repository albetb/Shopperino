import { useSelector } from 'react-redux';
import Spellbook from '../../../lib/spellbook';
import { playerToSpellbookData } from '../../../lib/player/playerSpellbookAdapter';

const CLASSES = ['Sorcerer', 'Wizard', 'Cleric', 'Druid', 'Bard', 'Ranger', 'Paladin'];

function groupByLevel(items = [], key) {
  return items.reduce((acc, sp) => {
    const entry = sp.Level.split(',').map(p => p.trim()).find(p => p.startsWith(key + ' '));
    const lvl = entry ? parseInt(entry.slice(key.length).trim(), 10) : null;
    if (lvl != null && !isNaN(lvl)) {
      acc[lvl] = acc[lvl] || [];
      acc[lvl].push(sp);
    }
    return acc;
  }, {});
}

function mergeByLevel(mapA, mapB) {
  const merged = { ...mapA };
  Object.entries(mapB).forEach(([level, listB]) => {
    merged[level] = merged[level]
      ? merged[level].concat(listB)
      : listB.slice();
  });
  return merged;
}

function emptySpellbookResult() {
  return {
    spellbook: null,
    page: 0,
    filters: { name: '', school: '' },
    isCollapsed: { domainDesc: false, classDesc: true, levels: [false, false, false, false, false, false, false, false, false, false] },
    spellsByLevel: {},
    levels: [],
    spontaneousByLevel: {},
    domainByLevel: {},
    preparedDomainByLevel: {},
    classDesc: '',
    domainDesc: '',
    hasUsedSpells: false,
    inst: null,
    spellsPerDay: [],
    charBonus: 0,
  };
}

export default function usePlayerSpellbookData() {
  const player = useSelector(s => s.playerSheet.player);
  const page = useSelector(s => s.playerSheet.playerSpellbookPage);
  const levelCollapsed = useSelector(s => s.playerSheet.playerSpellbookLevelCollapsed);
  const classDescCollapsed = useSelector(s => s.playerSheet.playerSpellbookClassDescCollapsed);
  const domainDescCollapsed = useSelector(s => s.playerSheet.playerSpellbookDomainDescCollapsed);
  const nameFilter = useSelector(s => s.playerSheet.playerSpellbookSearchName);
  const schoolFilter = useSelector(s => s.playerSheet.playerSpellbookSearchSchool);

  const data = playerToSpellbookData(player);
  if (!data || !CLASSES.includes(data.Class)) return emptySpellbookResult();
  if (['Ranger', 'Paladin'].includes(data.Class) && (data.Level || 0) < 4) return emptySpellbookResult();

  const inst = new Spellbook().load(data);
  const all = inst.getAllSpells({ name: nameFilter, school: schoolFilter });
  const learned = inst.getLearnedSpells({ name: nameFilter, school: schoolFilter });
  const prepared = inst.getPreparedSpells({ name: nameFilter, school: schoolFilter });
  const spontaneous = inst.getSpontaneousSpells({ name: nameFilter, school: schoolFilter });
  const domain = inst.getDomainSpells({ name: nameFilter, school: schoolFilter });
  const preparedDomain = inst.getPreparedDomainSpells({ name: nameFilter, school: schoolFilter });
  const spellsPerDay = inst.getSpellsPerDay();
  const charBonus = inst.getCharBonus();
  const classDesc = inst.getSpellcastingDescription();
  const domainDesc = inst.getDomainDescription();

  let spells =
    page === 1 && inst.Class === 'Wizard' ? learned :
    page === 2 ? (['Sorcerer', 'Bard'].includes(inst.Class) ? learned : prepared) :
    all;

  const keyMap = {
    Sorcerer: 'Sor/Wiz', Wizard: 'Sor/Wiz', Cleric: 'Clr',
    Druid: 'Drd', Bard: 'Brd', Ranger: 'Rgr', Paladin: 'Pal'
  };
  const key = keyMap[inst.Class] || '';

  const domainByLevel1 = groupByLevel(domain, inst.Domain1);
  const domainByLevel2 = groupByLevel(domain, inst.Domain2);
  const spellsByLevel = groupByLevel(spells || [], key);
  const spontaneousByLevel = groupByLevel(spontaneous || [], key);
  const domainByLevel = mergeByLevel(domainByLevel1 || {}, domainByLevel2 || {});

  const preparedDomainByLevel = preparedDomain.reduce((acc, { level, spell, Prepared, Used }) => {
    if (!acc[level]) acc[level] = [];
    acc[level].push({ spell, Prepared, Used });
    return acc;
  }, {});

  const allLevelKeys = [
    ...Object.keys(spellsByLevel),
    ...Object.keys(spontaneousByLevel),
    ...Object.keys(domainByLevel),
  ];
  const levels = Array.from(new Set(allLevelKeys.map(Number))).sort((a, b) => a - b);

  const levelsArr = Array.isArray(levelCollapsed) && levelCollapsed.length >= 10
    ? levelCollapsed.slice(0, 10)
    : Array(10).fill(false);

  return {
    spellbook: data,
    page,
    filters: { name: nameFilter, school: schoolFilter },
    isCollapsed: { domainDesc: domainDescCollapsed, classDesc: classDescCollapsed, levels: levelsArr },
    spellsByLevel,
    levels,
    spontaneousByLevel,
    domainByLevel,
    preparedDomainByLevel,
    classDesc,
    domainDesc,
    hasUsedSpells: inst.getHasUsedSpells(),
    inst,
    spellsPerDay,
    charBonus,
  };
}
