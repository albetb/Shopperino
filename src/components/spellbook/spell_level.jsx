import PropTypes from 'prop-types';
import StatInfo from '../common/StatInfo';
import InfoPopover from '../common/InfoPopover';
import { AUGMENT_SUMMONING_ABILITY_NAMES } from '../../lib/player/augmentSummoning';
import { isMobile, trimLine } from '../../lib/utils';
import { addCardByLink } from '../../store/slices/appSlice';
import SpontaneousSpells from './spontaneous_spells';
import DomainSpells from './domain_spells';
import { LearnTab, FusedStepper, StarOrbitCast } from './row_actions';
import { CLASSSPELLKEY as classKeyMap } from '../../lib/spellbook/spellbook';
import MetamagicPills from './metamagic_pills';
import MetamagicPrepareButton from './metamagic_prepare';
import MetamagicCastButton from './metamagic_cast';
import '../../style/metamagic.css';
import { useUnits } from '../hooks/useUnits';

export default function SpellLevelCard({
  level,
  spells,
  spontaneousSpells,
  domainSpells,
  preparedDomainSpells,
  collapsed,
  toggle,
  page,
  inst,
  spellsPerDay,
  charBonus,
  getSaveDC,
  getSummonBonus,
  getSpellResistance,
  actions,
  dispatch,
  showShortDescriptions,
  castingBlocked = false,
  castingBlockedReason = '',
  metamagicRods = []
}) {
  const u = useUnits();

  const key = classKeyMap[inst.Class] || '';

  const spontList = spontaneousSpells || [];
  const showSpont = page === 2 && spontList.length > 0 && !collapsed;
  const domainList = domainSpells || [];
  const showDomainPrepare = page === 1 && inst.Class === 'Cleric' && level !== 0 && domainList.length > 0 && !collapsed;
  const showDomainSpellbook = page === 2 && level !== 0 && preparedDomainSpells && preparedDomainSpells.length > 0 && !collapsed;
  const slotsAtLevel = (inst.PreparedDomainSpells && inst.PreparedDomainSpells[level]) || [];

  /* Casts left. The model answers it for both casting styles, because a
     metamagic'd cast spends a slot of the *modified* level and the component
     has no business knowing that. */
  const getRemaining = (link, mm = 0) => inst.getRemainingFor(link, mm);

  const availableMetamagic = inst.getAvailableMetamagic?.() ?? [];
  const spontaneous = inst.isSpontaneous?.() ?? false;
  const showPrepareMetamagic = page === 1 && availableMetamagic.length > 0;
  const showCastMetamagic = page === 2
    && ((spontaneous && availableMetamagic.length > 0) || metamagicRods.length > 0);

  const learned = inst.getLearnedSpells();
  const learnedLinks = new Set(learned.map(x => x.Link));
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
        // Not a cap: the figure is what levelling grants for free, and copying
        // scrolls legitimately puts a wizard above it. Never flagged.
        return lvl === 0
          ? `Lv${lvl} (Wizards know all lv0 spells)`
          : `Lv${lvl} (${spellLength - learnedByLevel0Length}/${known} free in total)`;
      case (page === 1): {
        /* Counted by the slot each preparation occupies rather than by the
           spell's own level, so an empowered magic missile is charged to the
           3rd-level allowance it actually spends. The model owns the sum. */
        let totalPrep = inst.getPreparedCountAtLevel(lvl);
        const totalPrepSpec = inst.Specialized
          ? inst.getPreparedCountAtLevel(lvl, { school: inst.Specialized })
          : 0;

        let mageSpec = "";
        const hasOneSpellOfSpec = totalPrepSpec > 0;
        if (isSpecialized) {
          mageSpec = `${hasOneSpellOfSpec ? "1" : "0"}/1 ${inst.Specialized}`;
          if (hasOneSpellOfSpec)
            totalPrep -= 1;
        }

        const domainPart = inst.Class === 'Cleric' && lvl !== 0
          ? ` Domain (${((inst.PreparedDomainSpells && inst.PreparedDomainSpells[lvl]) || []).reduce((sum, s) => sum + (s.Prepared || 0), 0)}/1)`
          : '';
        return `Lv${lvl} (${totalPrep}/${spellsPerDay[lvl]} per day) ${mageSpec}${domainPart}`;
      }
      default:
        const mageSpec = isSpecialized ? "+1" : "";
        return `Lv${lvl} (${spellsPerDay[lvl]}${mageSpec}/day) CD ${10 + charBonus + lvl}`;
    }
  };

  // Sorcerers and bards know a fixed number of spells per level. Going over is
  // allowed — the count is highlighted rather than blocked, per CLAUDE.md.
  const knownOverCap = page === 0 ? inst.getSpellsKnownOverCap(level) : 0;

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
        <h3 className={`card-title${knownOverCap > 0 ? ' card-title-over-cap' : ''}`}>
          {trimLine(spellCardTitle(level), isMobile() ? 35 : 45)}
          {knownOverCap > 0 && (
            <span className="over-cap-badge" title="More spells known than the table allows">
              +{knownOverCap}
            </span>
          )}
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
          showShortDescriptions={showShortDescriptions}
          getRemaining={getRemaining}
          totalForLevel={spellsPerDay[level] || 0}
          onUseSpell={actions?.onUseSpell}
        />
      )}

      {showDomainPrepare && (
        <table className="spellbook-table">
          <thead>
            <tr>
              <th className="dark-grey col-btn-sm"></th>
              <th className="dark-grey spell-table-header-title">
                Domain spell
              </th>
              {!isMobile() && (<th className="dark-grey col-30"></th>)}
            </tr>
          </thead>
          <tbody>
            {domainList.map((item, i) => {
              const slotForSpell = slotsAtLevel.find(s => s.Link === item.Link);
              const prepCount = slotForSpell ? slotForSpell.Prepared : 0;
              return (
                <tr key={i}>
                  <td className={`${i === 0 ? 'first' : ''} col-btn-sm action-cell`}>
                    <FusedStepper
                      value={prepCount}
                      onChange={(next) => {
                        if (next > prepCount) actions?.onPrepareDomainSpell?.(level, item.Link);
                        else if (next < prepCount) actions?.onUnprepareDomainSpell?.(level, item.Link);
                      }}
                    />
                  </td>
                  <td className={`${i === 0 ? 'first' : ''} col-auto`}>
                    <button
                      className="button-link spell-table-cell-name"
                      onClick={() => dispatch(addCardByLink({ links: item.Link, bonus: 0 }))}
                    >
                      {item.Name}
                    </button>
                    {showShortDescriptions && item['Short Description'] && (
                      <div className="spell-table-cell-desc">
                        {u.text(item['Short Description'])}
                      </div>
                    )}
                  </td>
                  {!isMobile() && (
                    <td className={`${i === 0 ? 'first' : ''} col-30`}>
                      {item.School.split(' ')[0]}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showDomainSpellbook && (
        <DomainSpells
          preparedByLevel={{ [level]: preparedDomainSpells }}
          preparedLevels={[level]}
          onUseDomainSpell={actions?.onUseDomainSpell}
          dispatch={dispatch}
          showShortDescriptions={showShortDescriptions}
        />
      )}

      {!collapsed && spells && spells.length > 0 && (
        <table className="spellbook-table">
          <tbody>
            {spells.map((item, i) => {
              const firstClass = i === 0 ? 'first' : '';
              return (
                <tr key={i}>
                  {page === 0 && (
                    <td className={`${firstClass} col-btn-sm action-cell`}>
                      <LearnTab
                        learned={learnedLinks.has(item.Link)}
                        onClick={() => actions?.onLearnUnlearnSpell?.(item.Link)}
                      />
                    </td>
                  )}

                  {page === 1 && (() => {
                    const mm = item.mm || 0;
                    const prepared = inst.getSpellPreparedUsed(item.Link, mm).Prepared || 0;
                    return (
                      <td className={`${firstClass} col-btn-sm action-cell`}>
                        <FusedStepper
                          value={prepared}
                          onChange={(next) => {
                            if (next > prepared) actions?.onPrepareSpell?.(item.Link, mm);
                            else if (next < prepared) actions?.onUnprepareSpell?.(item.Link, mm);
                          }}
                        />
                      </td>
                    );
                  })()}

                  {page === 2 && (() => {
                    const mm = item.mm || 0;
                    const remaining = getRemaining(item.Link, mm);
                    const total = spontaneous
                      ? (spellsPerDay[level] || 0)
                      : (inst.getSpellPreparedUsed(item.Link, mm).Prepared || 0);
                    return (
                      <td className={`${firstClass} col-btn-sm-max action-cell`}>
                        <StarOrbitCast
                          remaining={remaining}
                          total={total}
                          blocked={castingBlocked}
                          blockedReason={castingBlockedReason}
                          onClick={() => actions?.onUseSpell?.(item.Link, mm)}
                        />
                      </td>
                    );
                  })()}

                  <td className={`${firstClass} col-auto`}>
                    <div className="spell-table-cell-name-row">
                      <button
                        className={'button-link spell-table-cell-name' + schoolClass(item.School)}
                        onClick={() => dispatch(addCardByLink({ links: item.Link, bonus: 0 }))}
                      >
                        {item.Name}
                      </button>
                      {/* Mobile wizard-learn: school inline with name so the
                          description below spans the full row width. */}
                      {isMobile() && inst.Class === 'Wizard' && page === 0 && (
                        <span className={'spell-school-inline' + schoolClass(item.School)}>
                          {item.School.split(' ')[0]}
                        </span>
                      )}
                      <MetamagicPills mm={item.mm || 0} />
                      {showPrepareMetamagic && !item.mm && inst.getSpellBaseLevel(item) !== null && (
                        <MetamagicPrepareButton
                          spell={item}
                          baseLevel={inst.getSpellBaseLevel(item)}
                          available={availableMetamagic}
                          preparations={inst.getMetamagicPreparations(item.Link)}
                          preparedFor={(mm) => inst.getSpellPreparedUsed(item.Link, mm).Prepared || 0}
                          onPrepare={(mm) => actions?.onPrepareSpell?.(item.Link, mm)}
                          onUnprepare={(mm) => actions?.onUnprepareSpell?.(item.Link, mm)}
                        />
                      )}
                      {showCastMetamagic && inst.getSpellBaseLevel(item) !== null && (
                        <MetamagicCastButton
                          spell={item}
                          baseLevel={inst.getSpellBaseLevel(item)}
                          spontaneous={spontaneous}
                          available={availableMetamagic}
                          rods={metamagicRods}
                          remainingFor={(mm) => getRemaining(item.Link, mm)}
                          blocked={castingBlocked}
                          onCast={(mm) => actions?.onUseSpell?.(item.Link, mm)}
                          onCastWithRod={(rodId) => actions?.onUseSpellWithRod?.(item.Link, rodId, item.mm || 0)}
                        />
                      )}
                      {(() => {
                        /* The DC a target rolls against, for the spells that
                           allow a save. Shown here rather than only in the
                           spell card because it is read every time the spell
                           is cast — and it is the only place Spell Focus has
                           ever been able to appear. */
                        /* Heighten is the one metamagic that raises the
                           spell's own level, so the DC is asked for the
                           effective level rather than for the card's. */
                        const save = getSaveDC?.(item.effectiveLevel ?? level, item);
                        if (!save) return null;
                        return (
                          <span className="spell-save-dc-group">
                            <span
                              className={'spell-save-dc' + (save.focused ? ' is-focused' : '')}
                              title={save.focused
                                ? 'Save DC, including Spell focus for this school'
                                : 'Save DC against this spell'}
                            >
                              DC {save.dc}
                            </span>
                            <StatInfo
                              label={`${item.Name} save DC`}
                              value={save.dc}
                              contributions={save.contributions ?? []}
                            />
                          </span>
                        );
                      })()}
                      {(() => {
                        /* The caster level check against spell resistance, on
                           the 277 spells resistance can stop. The check is
                           1d20 + this; Spell penetration is the only thing
                           that has ever been able to move it. */
                        const sr = getSpellResistance?.(item);
                        if (!sr) return null;
                        const label = sr.qualifier
                          ? `SR ${sr.qualifier}`
                          : 'SR';
                        return (
                          <span className="spell-sr-group">
                            <span
                              className={'spell-sr' + (sr.penetration > 0 ? ' is-focused' : '')}
                              title={`${label} — roll 1d20+${sr.check} against the creature's spell resistance`}
                            >
                              {label} +{sr.check}
                            </span>
                            <StatInfo
                              label={`${item.Name} caster level check`}
                              value={sr.check}
                              primaryLabel="Caster level check"
                              contributions={sr.contributions ?? []}
                            />
                          </span>
                        );
                      })()}
                      {(() => {
                        /* Augment Summoning does not change this spell — it
                           changes what the spell brings — so it is a note on
                           the row rather than a number in it. Absent unless
                           the caster has the feat and the spell summons
                           something with a Strength score. */
                        const summon = getSummonBonus?.(item);
                        if (!summon) return null;
                        return (
                          <span className="spell-summon-bonus">
                            <InfoPopover label="Augment summoning">
                              <p>
                                Every creature this spell summons gains{' '}
                                <b>+{summon.bonus} {summon.type}</b> to{' '}
                                {summon.abilities.map((k) => AUGMENT_SUMMONING_ABILITY_NAMES[k] ?? k).join(' and ')},
                                for the whole duration.
                              </p>
                              <p>
                                That is +{Math.floor(summon.bonus / 2)} to melee attack
                                and damage rolls, to Fortitude saves, and to the
                                creature's hit points per Hit Die.
                              </p>
                            </InfoPopover>
                          </span>
                        );
                      })()}
                    </div>
                    {showShortDescriptions && item['Short Description'] && (
                      <div className="spell-table-cell-desc">
                        {u.text(item['Short Description'])}
                      </div>
                    )}
                  </td>

                  {/* Desktop only: school in its own column. Mobile renders it
                      inline inside the name cell (above) when applicable. */}
                  {!isMobile() && (
                    <td className={firstClass + schoolClass(item.School) + ' col-30'}>
                      {item.School.split(' ')[0]}
                    </td>
                  )}
                </tr>
              );
            })}
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
  spontaneousSpells: PropTypes.array,
  domainSpells: PropTypes.array,
  preparedDomainSpells: PropTypes.arrayOf(PropTypes.shape({
    spell: PropTypes.object,
    Prepared: PropTypes.number,
    Used: PropTypes.number
  })),
  collapsed: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  inst: PropTypes.object.isRequired,
  spellsPerDay: PropTypes.arrayOf(PropTypes.number).isRequired,
  charBonus: PropTypes.number.isRequired,
  /** (level, spell) -> { dc, focused } for spells that allow a save, else null. */
  getSaveDC: PropTypes.func,
  getSummonBonus: PropTypes.func,
  getSpellResistance: PropTypes.func,
  actions: PropTypes.shape({
    onLearnUnlearnSpell: PropTypes.func,
    onPrepareSpell: PropTypes.func,
    onUnprepareSpell: PropTypes.func,
    onUseSpell: PropTypes.func,
    onPrepareDomainSpell: PropTypes.func,
    onUnprepareDomainSpell: PropTypes.func,
    onUseDomainSpell: PropTypes.func,
  }),
  dispatch: PropTypes.func.isRequired,
  showShortDescriptions: PropTypes.bool.isRequired,
  /** True when the caster cannot cast at all right now (a wild-shaped druid
      without Natural Spell). Slot counts stay visible; only the button locks. */
  castingBlocked: PropTypes.bool,
  castingBlockedReason: PropTypes.string,
  /** Metamagic rods in hand. Player-sheet only — a standalone spellbook has no
      character, so it has no hands. */
  metamagicRods: PropTypes.array
};
