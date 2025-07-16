import { useDispatch, useSelector } from 'react-redux';
import Spellbook from '../../lib/spellbook';
import { isMobile, trimLine } from '../../lib/utils';
import { addCardByLink } from '../../store/slices/appSlice';
import { setIsClassDescriptionCollapsed, setSearchSpellName, setSearchSpellSchool } from '../../store/slices/spellbookSlice';
import { onCollapseSpellTable, onLearnUnlearnSpell, onPrepareSpell, onRefreshSpell, onUnprepareSpell, onUseSpell } from '../../store/thunks/spellbookThunks';
import '../../style/shop_inventory.css';

export default function SpellbookTable() {
  const dispatch = useDispatch();
  const spellbook = useSelector(s => s.spellbook.spellbook);
  const spellbookPage = useSelector(s => s.spellbook.spellbookPage);
  const isSpellTableCollapsed = useSelector(s => s.spellbook.isSpellTableCollapsed);
  const isClassDescriptionCollapsed = useSelector(s => s.spellbook.isClassDescriptionCollapsed);
  const searchSpellName = useSelector(s => s.spellbook.searchSpellName);
  const searchSpellSchool = useSelector(s => s.spellbook.searchSpellSchool);

  if (!spellbook?.Class) return null;

  const inst = new Spellbook().load(spellbook);
  const all_spells = inst.getAllSpells({ name: searchSpellName, school: searchSpellSchool });
  const prepared = inst.getPreparedSpells({ name: searchSpellName, school: searchSpellSchool });
  const learned = inst.getLearnedSpells({ name: searchSpellName, school: searchSpellSchool });
  const spells_per_day = inst.getSpellsPerDay();
  const char_bonus = inst.getCharBonus();
  const class_desc = inst.getClassDescription();
  const spell_known = inst.getSpellsKnown();

  let spells = all_spells;
  let header_text;
  switch (spellbookPage) {
    case 1:
      if (inst.Class === "Wizard") {
        spells = learned;
      }
      header_text = `${trimLine(spellbook.Name, isMobile() ? 20 : 30)} is preparing spells`;
      break;
    case 2:
      if (["Sorcerer", "Bard"].includes(inst.Class)) {
        spells = learned;
      } else {
        spells = prepared;
      }
      header_text = `Spellbook of ${trimLine(spellbook.Name, isMobile() ? 20 : 30)}`;
      break;
    default:
      header_text = `${trimLine(spellbook.Name, isMobile() ? 20 : 30)} is learning spells`;
  }

  const classKeyMap = {
    Sorcerer: 'Sor/Wiz',
    Wizard: 'Sor/Wiz',
    Cleric: 'Clr',
    Druid: 'Drd',
    Bard: 'Brd',
    Ranger: 'Rgr',
    Paladin: 'Pal'
  };
  const key = classKeyMap[spellbook.Class] || '';

  const byLevel = spells.reduce((acc, sp) => {
    const entry = sp.Level
      .split(',')
      .map(p => p.trim())
      .find(p => p.startsWith(key + ' '));
    const lvl = entry
      ? parseInt(entry.slice(key.length).trim(), 10)
      : null;
    if (lvl !== null && !isNaN(lvl)) {
      acc[lvl] = acc[lvl] || [];
      acc[lvl].push(sp);
    }
    return acc;
  }, {});

  const levels = Object.keys(byLevel)
    .map(Number)
    .sort((a, b) => a - b);

  function getRemaining(link) {

    if (["Sorcerer", "Bard"].includes(inst.Class)) {

      const spell = all_spells.find(x => x.Link === link);
      let spell_level = 0;

      const class_map = {
        "Sorcerer": "Sor/Wiz ",
        "Bard": "Brd "
      }

      spell_level = spell.Level.split(class_map[inst.Class])[1];
      if (spell_level.includes(","))
        spell_level = spell_level.split(",")[0];
      spell_level = parseInt(spell_level);

      const total_per_level = learned.filter(x => x.Level.includes(class_map[inst.Class] + spell_level))
        .map(x => inst.Spells.find(y => y.Link === x.Link).Used)
        .reduce(function (a, b) { return a + b; }, 0);

      return Math.max(0, spells_per_day[spell_level] - total_per_level);
    }

    const { Prepared = 0, Used = 0 } = inst.Spells.find(x => x.Link === link) || {};
    return Math.max(0, Prepared - Used);
  }

  function spellCardTitle(lvl) {
    if (["Sorcerer", "Bard"].includes(inst.Class) && spellbookPage === 0) {
      const learnedByLevel = learned.reduce((acc, sp) => {
        const entry = sp.Level
          .split(',')
          .map(p => p.trim())
          .find(p => p.startsWith(key + ' '));
        const lvl = entry
          ? parseInt(entry.slice(key.length).trim(), 10)
          : null;
        if (lvl !== null && !isNaN(lvl)) {
          acc[lvl] = acc[lvl] || [];
          acc[lvl].push(sp);
        }
        return acc;
      }, {});
      const spells_for_level = (learnedByLevel[lvl] ?? []).length;
      return `Lv${lvl} (${spells_for_level}/${spell_known[lvl]} known)`;
    }
    if (["Wizard"].includes(inst.Class) && spellbookPage === 0) {
      if (lvl === 0)
        return `Lv${lvl} (Wizards know all lv0 spells)`;
      return `Lv${lvl} (${inst.Spells.length - 19}/${spell_known} known in total)`;
    }
    if (spellbookPage === 1) {
      const preparedByLevel = learned.reduce((acc, sp) => {
        const entry = sp.Level
          .split(',')
          .map(p => p.trim())
          .find(p => p.startsWith(key + ' '));
        const lvl = entry
          ? parseInt(entry.slice(key.length).trim(), 10)
          : null;
        if (lvl !== null && !isNaN(lvl)) {
          acc[lvl] = acc[lvl] || [];
          acc[lvl].push(sp);
        }
        return acc;
      }, {});
      const spells_for_level = preparedByLevel[lvl] ?? [];
      const pblIntegrated = spells_for_level
        .map(x =>
          parseInt(inst.Spells.find(y => y.Link === x.Link).Prepared)
        ).reduce(function (a, b) { return a + b; }, 0);
      return `Lv${lvl} (${pblIntegrated}/${spells_per_day[lvl]} per day)`
    }
    return `Lv${lvl} (${spells_per_day[lvl]}/day) CD ${10 + char_bonus + lvl}`;
  }

  return (
    <>
      <div className="header-container">
        <h4>
          {header_text}
        </h4>
      </div>

      {searchSpellName && (
        <div className="filter-box">
          <div className="card-side-div card-expand-div" style={{ width: "100%" }}>
            <p style={{ color: "var(--white)" }}>Filter by name: <b>{searchSpellName}</b></p>
            <button className="close-button no-margin-right" onClick={() => dispatch(setSearchSpellName(""))}>
              <span style={{ color: "var(--white)" }} className="material-symbols-outlined">close_small</span>
            </button>
          </div>
        </div>
      )}

      {searchSpellSchool && (
        <div className="filter-box">
          <div className="card-side-div card-expand-div" style={{ width: "100%" }}>
            <p style={{ color: "var(--white)" }}>Filter by school: <b>{searchSpellSchool}</b></p>
            <button className="close-button no-margin-right" onClick={() => dispatch(setSearchSpellSchool(""))}>
              <span style={{ color: "var(--white)" }} className="material-symbols-outlined">close_small</span>
            </button>
          </div>
        </div>
      )}

      {spellbookPage === 2 && (
        <div
          className={`filter-box rest-box ${!inst.getHasUsedSpells() ? "opacity-50" : ""}`}
          onClick={() => dispatch(onRefreshSpell())}
          disabled={!inst.getHasUsedSpells()}>
          <div className="card-side-div card-expand-div" style={{ width: "100%", height: "100%" }}>
            <button className="close-button no-margin-left" >
              <span style={{ color: "var(--white)" }} className="material-symbols-outlined">bedtime</span>
            </button>
            <p style={{ color: "var(--white)" }}>Long rest</p>
          </div>
        </div>
      )}

      <div className={`card card-width-spellbook ${isClassDescriptionCollapsed ? 'collapsed' : ''}`}>
        <div
          className="card-side-div card-expand-div"
          onClick={() => dispatch(setIsClassDescriptionCollapsed(!isClassDescriptionCollapsed))}
        >
          <h3 className="card-title">{spellbook.Class}</h3>
          <button
            className="collapse-button"
          >
            <span className="material-symbols-outlined">
              {isClassDescriptionCollapsed ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
        {!isClassDescriptionCollapsed &&
          <div
            className="class-desc"
            dangerouslySetInnerHTML={{ __html: class_desc }}
          />}
      </div>

      {levels.map(lvl => {
        const isCollapsed = isSpellTableCollapsed?.[lvl] ?? false;
        return (
          <div key={lvl} className={`card card-width-spellbook ${isCollapsed ? 'collapsed' : ''}`}>
            <div
              className="card-side-div card-expand-div"
              onClick={() => dispatch(onCollapseSpellTable(lvl))}
            >
              <h3 className="card-title">{trimLine(spellCardTitle(lvl), isMobile() ? 35 : 45)}</h3>
              <button
                className="collapse-button"
              >
                <span className="material-symbols-outlined">
                  {isCollapsed ? 'expand_more' : 'expand_less'}
                </span>
              </button>
            </div>
            {!isCollapsed && (
              <table className="spellbook-table">
                <tbody>

                  {byLevel[lvl].map((item, i) =>
                    <tr key={i}>

                      {spellbookPage === 0 && (
                        <td style={{ width: 'auto' }} className={i === 0 ? 'first' : ''}>
                          <button className={`item-number-button smaller ${learned.map(x => x.Link).includes(item.Link) ? "opacity-50" : ""}`}>
                            <span
                              className="material-symbols-outlined"
                              onClick={() => dispatch(onLearnUnlearnSpell(item.Link))}
                            >
                              {learned.map(x => x.Link).includes(item.Link) ? "bookmark_remove" : "bookmark_add"}
                            </span>
                          </button>
                        </td>
                      )}

                      {(spellbookPage === 1) && (
                        <td style={{ width: 'var(--btn-width-sm)' }} className={i === 0 ? 'first' : ''}>
                          <div className='card-side-div'>
                            <div className='spell-slot-div'>

                              <button
                                className={`levels-button smaller 
                                  ${(inst.Spells.find(x => x.Link === item.Link) ?? { Prepared: 0 }).Prepared === 0 ? "opacity-50" : ""}`}
                                onClick={() => dispatch(onUnprepareSpell(item.Link))}
                                disabled={(inst.Spells.find(x => x.Link === item.Link) ?? { Prepared: 0 }).Prepared === 0}>
                                <span className='material-symbols-outlined'>
                                  remove
                                </span>
                              </button>

                              <label className='level-text'>{parseInt(
                                (inst.Spells.find(x => x.Link === item.Link) ?? { Prepared: 0 }).Prepared
                              )}</label>

                              <button className='levels-button smaller' onClick={() => dispatch(onPrepareSpell(item.Link))}>
                                <span className='material-symbols-outlined'>
                                  add
                                </span>
                              </button>

                            </div>
                          </div>
                        </td>
                      )}

                      {spellbookPage === 2 && (
                        <td style={{ width: 'var(--btn-width-sm)', maxWidth: 'calc(var(--btn-width-sm) * 1.4)', paddingRight: '0px' }} className={i === 0 ? 'first' : ''}>
                          <div className='card-side-div'>
                            <div className='spell-slot-div2'>

                              <button
                                className={`item-number-button smaller ${getRemaining(item.Link) <= 0 ? "opacity-50" : ""}`}
                                onClick={() => dispatch(onUseSpell(item.Link))}
                                disabled={getRemaining(item.Link) <= 0}>
                                <span className='material-symbols-outlined'>
                                  wand_stars
                                </span>
                              </button>

                              <label className='level-text'>{
                                getRemaining(item.Link)
                              }</label>
                            </div>
                          </div>
                        </td>
                      )}

                      <td style={{ width: 'auto' }} className={i === 0 ? 'first' : ''}>
                        <button
                          className="button-link"
                          style={{ color: 'var(--black)' }}
                          onClick={() => dispatch(addCardByLink({ links: item.Link, bonus: 0 }))}
                        >
                          {item.Name}
                        </button>
                      </td>
                      {((spellbookPage !== 1) || !isMobile()) &&
                        <td style={{ width: '30%', fontSize: 'small' }} className={i === 0 ? 'first' : ''}>
                          {item.School.split(' ')[0]}
                        </td>
                      }
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </>
  );
}
