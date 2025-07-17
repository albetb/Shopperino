import { useDispatch } from 'react-redux';
import SpellbookTableHeader from './spellbook_header';
import SpellFilters from './spell_filters';
import RestBox from './rest_box';
import ClassDescriptionCard from './class_description';
import DomainDescriptionCard from './domain_description';
import SpellLevelCard from './spell_level';
import useSpellbookData from '../hooks/use_spellbook_data';
import '../../style/shop_inventory.css';

export default function SpellbookTable() {
  const dispatch = useDispatch();
  const {
    spellbook, page, isCollapsed, filters,
    spellsByLevel, levels,
    spontaneousByLevel, domainByLevel,
    classDesc, domainDesc, hasUsedSpells, inst,
    spellsPerDay, charBonus
  } = useSpellbookData();

  if (!spellbook?.Class) return null;

  return (
    <>
      <SpellbookTableHeader
        spellbook={spellbook}
        page={page}
        dispatch={dispatch}
      />

      <SpellFilters
        filters={filters}
        dispatch={dispatch}
      />

      <RestBox
        page={page}
        hasUsedSpells={hasUsedSpells}
        dispatch={dispatch}
      />

      <ClassDescriptionCard
        className={spellbook.Class}
        description={classDesc}
        collapsed={isCollapsed.classDesc}
        toggle={() => dispatch({ type: 'spellbook/setIsClassDescriptionCollapsed', payload: !isCollapsed.classDesc })}
      />

      {spellbook?.Class === "Cleric"
      && (spellbook?.Domain1 || spellbook?.Domain2)
      && <DomainDescriptionCard
        description={domainDesc}
        collapsed={isCollapsed.domainDesc}
        toggle={() => dispatch({ type: 'spellbook/setIsDomainDescriptionCollapsed', payload: !isCollapsed.domainDesc })}
      />}

      {levels.map(lvl => (
        <SpellLevelCard
          key={lvl}
          level={lvl}
          spells={spellsByLevel[lvl]}
          spontaneousSpells={spontaneousByLevel[lvl]}
          domainSpells={domainByLevel[lvl]}
          collapsed={isCollapsed.levels[lvl]}
          toggle={() => dispatch({ type: 'spellbook/setIsSpellTableCollapsed', payload: isCollapsed.levels.map((x, i) => i !== lvl ? x : !x) })}
          page={page}
          inst={inst}
          spellsPerDay={spellsPerDay}
          charBonus={charBonus}
          dispatch={dispatch}
        />
      ))}
    </>
  );
}
