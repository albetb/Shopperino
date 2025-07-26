import PropTypes from 'prop-types';
import { isMobile, trimLine } from '../../lib/utils';
import { addCardByLink } from '../../store/slices/appSlice';
import { onLearnUnlearnSpell, onPrepareSpell, onUnprepareSpell, onUseSpell } from '../../store/thunks/spellbookThunks';
import SpontaneousSpells from './spontaneous_spells';
import DomainSpells from './domain_spells';

const classKeyMap = {
  Sorcerer: 'Sor/Wiz',
  Wizard: 'Sor/Wiz',
  Cleric: 'Clr',
  Druid: 'Drd',
  Bard: 'Brd',
  Ranger: 'Rgr',
  Paladin: 'Pal'
};

export default function SpellLevelCard({
  level,
  spells,
  spontaneousSpells,
  domainSpells,
  collapsed,
  toggle,
  page,
  inst,
  spellsPerDay,
  charBonus,
  dispatch
}) {

  const key = classKeyMap[inst.Class] || '';

  const spontList = spontaneousSpells || [];
  const showSpont = page === 2 && spontList.length > 0 && !collapsed;
  const domainList = domainSpells || [];
  const showDomain = page === 2 && domainList.length > 0 && !collapsed;
  const usedDomain = inst.UsedDomainSpells;

  const getRemaining = link => {
    if (["Sorcerer", "Bard"].includes(inst.Class)) {
      const spell = inst.getAllSpells().find(x => x.Link === link);
      let lvl = parseInt(spell.Level.split(`${classKeyMap[inst.Class]} `)[1].split(',')[0], 10);
      const totalUsed = inst.getLearnedSpells().filter(x => x.Level.includes(`${classKeyMap[inst.Class]} ${lvl}`))
        .map(x => inst.Spells.find(y => y.Link === x.Link).Used)
        .reduce((a, b) => a + b, 0);
      return Math.max(0, spellsPerDay[lvl] - totalUsed);
    }
    const { Prepared = 0, Used = 0 } = inst.Spells.find(x => x.Link === link) || {};
    return Math.max(0, Prepared - Used);
  };

  const learned = inst.getLearnedSpells();
  const spellLength = learned.length;

  const learnedByLevel = learned.reduce((acc, sp) => {
    const entry = sp.Level.split(',').map(p => p.trim()).find(p => p.startsWith(`${key} `));
    const l = entry ? parseInt(entry.slice(key.length).trim(), 10) : null;
    if (l != null) (acc[l] = acc[l] || []).push(sp);
    return acc;
  }, {});
  const learnedByLevel0Length = (learnedByLevel[0] ?? []).length;

  const isSpecialized = inst.Class === "Wizard"
    && inst.Specialized && inst.Forbidden1 && (inst.Forbidden2 || inst.Specialized === "Divination");

  const spellCardTitle = lvl => {
    const known = inst.getSpellsKnown();
    switch (true) {
      case (["Sorcerer", "Bard"].includes(inst.Class) && page === 0): {

        const count = (learnedByLevel[lvl] || []).length;
        return `Lv${lvl} (${count}/${known[lvl]} known)`;
      }
      case (inst.Class === 'Wizard' && page === 0):
        return lvl === 0
          ? `Lv${lvl} (Wizards know all lv0 spells)`
          : `Lv${lvl} (${spellLength - learnedByLevel0Length}/${known} known in total)`;
      case (page === 1): {
        const preparedList = learned.reduce((acc, sp) => {
          const entry = sp.Level.split(',').map(p => p.trim()).find(p => p.startsWith(`${key} `));
          const l = entry ? parseInt(entry.slice(key.length).trim(), 10) : null;
          if (l != null) (acc[l] = acc[l] || []).push(sp);
          return acc;
        }, {});
        const spellsFor = preparedList[lvl] || [];
        let totalPrep = spellsFor
          .map(x => parseInt(inst.Spells.find(y => y.Link === x.Link).Prepared, 10))
          .reduce((a, b) => a + b, 0);
        let totalPrepSpec = spellsFor
          .filter(x => x.School.toLowerCase().includes(inst.Specialized.toLowerCase()))
          .map(x => parseInt(inst.Spells.find(y => y.Link === x.Link).Prepared, 10))
          .reduce((a, b) => a + b, 0);

        let mageSpec = "";
        const hasOneSpellOfSpec = totalPrepSpec > 0;
        if (isSpecialized) {
          mageSpec = `${hasOneSpellOfSpec ? "1" : "0"}/1 ${inst.Specialized}`;
          if (hasOneSpellOfSpec)
            totalPrep -= 1;
        }


        return `Lv${lvl} (${totalPrep}/${spellsPerDay[lvl]} per day) ${mageSpec}`;
      }
      default:
        const mageSpec = isSpecialized ? "+1" : "";
        return `Lv${lvl} (${spellsPerDay[lvl]}${mageSpec}/day) CD ${10 + charBonus + lvl}`;
    }
  };

  const specialized = inst.Specialized;
  const baseSchoolClass = inst.Class === "Wizard" && specialized
    && inst.Forbidden1 && (inst.Forbidden2 || specialized === "Divination")

  const schoolClass = school => {
    if (baseSchoolClass && school.includes(specialized))
      return " highlight";
    return "";
  };

  return (
    <div className={`card card-width-spellbook ${collapsed ? 'collapsed' : ''}`}>
      <div className="card-side-div card-expand-div" onClick={toggle}>
        <h3 className="card-title">
          {trimLine(spellCardTitle(level), isMobile() ? 35 : 45)}
        </h3>
        <button className="collapse-button">
          <span className="material-symbols-outlined">
            {collapsed ? 'expand_more' : 'expand_less'}
          </span>
        </button>
      </div>

      {showSpont && (
        <SpontaneousSpells
          spontaneousByLevel={{ [level]: spontList }}
          spontaneousLevels={[level]}
          dispatch={dispatch}
        />
      )}

      {showDomain && (
        <DomainSpells
          domainByLevel={{ [level]: domainList }}
          domainLevels={[level]}
          usedDomain={usedDomain}
          dispatch={dispatch}
        />
      )}

      {!collapsed && (
        <table className="spellbook-table">
          <tbody>
            {spells && spells.map((item, i) => (
              <tr key={i}>
                {page === 0 && (
                  <td className={i === 0 ? 'first' : ''} style={{ width: 'var(--btn-width-sm)', maxWidth: 'var(--btn-width-sm)' }}>
                    <button
                      className={`flat-button smaller ${inst.getLearnedSpells().map(x => x.Link).includes(item.Link) ? 'opacity-50' : ''}`}
                      onClick={() => dispatch(onLearnUnlearnSpell(item.Link))}
                    >
                      <span className="material-symbols-outlined">
                        {inst.getLearnedSpells().map(x => x.Link).includes(item.Link) ? 'bookmark_remove' : 'bookmark_add'}
                      </span>
                    </button>
                  </td>
                )}

                {page === 1 && (
                  <td className={i === 0 ? 'first' : ''} style={{ width: 'var(--btn-width-sm)' }}>
                    <div className='card-side-div'>
                      <div className='spell-slot-div'>
                        <button
                          className={`smaller flat-button ${(inst.Spells.find(x => x.Link === item.Link)?.Prepared || 0) === 0 ? 'opacity-50' : ''
                            }`}
                          onClick={() => dispatch(onUnprepareSpell(item.Link))}
                          disabled={(inst.Spells.find(x => x.Link === item.Link)?.Prepared || 0) === 0}
                        >
                          <span className='material-symbols-outlined'>remove</span>
                        </button>
                        <label className='level-text'>
                          {inst.Spells.find(x => x.Link === item.Link)?.Prepared || 0}
                        </label>
                        <button
                          className='smaller flat-button'
                          onClick={() => dispatch(onPrepareSpell(item.Link))}
                        >
                          <span className='material-symbols-outlined'>add</span>
                        </button>
                      </div>
                    </div>
                  </td>
                )}

                {page === 2 && (
                  <td className={i === 0 ? 'first' : ''} style={{ width: 'var(--btn-width-sm)', maxWidth: 'calc(var(--btn-width-sm)*1.4)', paddingRight: 0 }}>
                    <div className='card-side-div'>
                      <div className='spell-slot-div2'>
                        <button
                          className={`flat-button smaller ${getRemaining(item.Link) <= 0 ? 'opacity-50' : ''}`}
                          onClick={() => dispatch(onUseSpell(item.Link))}
                          disabled={getRemaining(item.Link) <= 0}
                        >
                          <span className='material-symbols-outlined'>wand_stars</span>
                        </button>
                        <label className='level-text'>{getRemaining(item.Link)}</label>
                      </div>
                    </div>
                  </td>
                )}

                <td className={i === 0 ? 'first' : ''} style={{ width: 'auto' }}>
                  <button
                    className={'button-link' + schoolClass(item.School)}
                    style={{ color: 'var(--black)' }}
                    onClick={() => dispatch(addCardByLink({ links: item.Link, bonus: 0 }))}
                  >
                    {item.Name}
                  </button>
                </td>

                {!(page === 1 && isMobile()) && (
                  <td className={(i === 0 ? 'first' : '')
                    + schoolClass(item.School)
                  } style={{ width: '30%', fontSize: 'small' }}>
                    {item.School.split(' ')[0]}
                  </td>
                )}

              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

SpellLevelCard.propTypes = {
  level: PropTypes.number.isRequired,
  spells: PropTypes.arrayOf(PropTypes.shape({
    Link: PropTypes.string,
    Name: PropTypes.string,
    Level: PropTypes.string,
    School: PropTypes.string
  })),
  collapsed: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  inst: PropTypes.object.isRequired,
  spellsPerDay: PropTypes.arrayOf(PropTypes.number).isRequired,
  charBonus: PropTypes.number.isRequired,
  dispatch: PropTypes.func.isRequired
};
