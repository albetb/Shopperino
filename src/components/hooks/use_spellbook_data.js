import { useSelector } from 'react-redux';
import Spellbook from '../../lib/spellbook';

// Helper to group spells by class level
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

export default function useSpellbookData() {
    const spellbook = useSelector(s => s.spellbook.spellbook);
    const page = useSelector(s => s.spellbook.spellbookPage);
    const isSpellTableCollapsed = useSelector(s => s.spellbook.isSpellTableCollapsed);
    const isClassDescriptionCollapsed = useSelector(s => s.spellbook.isClassDescriptionCollapsed);
    const nameFilter = useSelector(s => s.spellbook.searchSpellName);
    const schoolFilter = useSelector(s => s.spellbook.searchSpellSchool);

    const inst = new Spellbook().load(spellbook);
    const all = inst.getAllSpells({ name: nameFilter, school: schoolFilter });
    const learned = inst.getLearnedSpells({ name: nameFilter, school: schoolFilter });
    const prepared = inst.getPreparedSpells({ name: nameFilter, school: schoolFilter });
    const spontaneous = inst.getSpontaneousSpells({ name: nameFilter, school: schoolFilter });
    const spellsPerDay = inst.getSpellsPerDay();
    const charBonus = inst.getCharBonus();
    const classDesc = inst.getClassDescription();

    let spells =
        page === 1 && inst.Class === 'Wizard' ? learned :
            page === 2 ? (['Sorcerer', 'Bard'].includes(inst.Class) ? learned : prepared) :
                all;

    const keyMap = {
        Sorcerer: 'Sor/Wiz', Wizard: 'Sor/Wiz', Cleric: 'Clr',
        Druid: 'Drd', Bard: 'Brd', Ranger: 'Rgr', Paladin: 'Pal'
    };
    const key = keyMap[spellbook.Class] || '';

    // group both sets by level
    const spellsByLevel = groupByLevel(spells, key);
    const spontaneousByLevel = groupByLevel(spontaneous, key);

    const levels = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b);
    const spontaneousLevels = Object.keys(spontaneousByLevel).map(Number).sort((a, b) => a - b);

    return {
        spellbook,
        page,
        filters: { name: nameFilter, school: schoolFilter },
        isCollapsed: { classDesc: isClassDescriptionCollapsed, levels: isSpellTableCollapsed },
        spellsByLevel,
        levels,
        spontaneousByLevel,
        spontaneousLevels,
        classDesc,
        hasUsedSpells: inst.getHasUsedSpells(),
        inst,
        spellsPerDay,
        charBonus
    };
}
