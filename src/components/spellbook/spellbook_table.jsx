import { useDispatch, useSelector } from 'react-redux';
import SpellbookTableHeader from './spellbook_header';
import SpellFilters from './spell_filters';
import RestBox from './rest_box';
import ClassDescriptionCard from './class_description';
import DomainDescriptionCard from './domain_description';
import WizardSchoolsCard from './wizard_schools_card';
import SpellLevelCard from './spell_level';
import SpellSwapNote from './spell_swap_note';
import GnomeSpellsCard from '../player_sheet/gnome_spells_card';
import useSpellbookData from './hooks/use_spellbook_data';
import usePlayerSpellbookData from '../player_sheet/hooks/use_player_spellbook_data';
import {
  setSpellbookPage,
  setIsSpellTableCollapsed,
  setIsClassDescriptionCollapsed,
  setIsDomainDescriptionCollapsed,
  setSearchSpellName,
  setSearchSpellSchool,
} from '../../store/slices/spellbookSlice';
import {
  setPlayerSpellbookPage,
  setPlayerSpellbookLevelCollapsed,
  setPlayerSpellbookClassDescCollapsed,
  setPlayerSpellbookDomainDescCollapsed,
  setPlayerSpellbookWizardSchoolsCollapsed,
  setPlayerSpellbookSearchName,
  setPlayerSpellbookSearchSchool,
} from '../../store/slices/playerSheetSlice';
import {
  onLearnUnlearnSpell,
  onPrepareSpell,
  onUnprepareSpell,
  onUseSpell,
  onRefreshSpell,
  onPrepareDomainSpell,
  onUnprepareDomainSpell,
  onUseDomainSpell,
  onSpecializedChange,
  onForbidden1Change,
  onForbidden2Change,
} from '../../store/thunks/spellbookThunks';
import {
  onPlayerLearnUnlearnSpell,
  onPlayerPrepareSpell,
  onPlayerUnprepareSpell,
  onPlayerUseSpell,
  onPlayerRefreshSpell,
  onPlayerPrepareDomainSpell,
  onPlayerUnprepareDomainSpell,
  onPlayerUseDomainSpell,
  onSetPlayerSpellOption,
} from '../../store/thunks/playerSheetThunks';
import '../../style/shop_inventory.css';
import '../../style/wild_shape.css';

/** The seven classes that get a spellbook at all — mirrors the hook's own list. */
const CASTER_CLASSES = ['Sorcerer', 'Wizard', 'Cleric', 'Druid', 'Bard', 'Ranger', 'Paladin'];

/**
 * What to say when the sheet has no spellbook to show.
 *
 * `pending` marks the cases a spellbook is still coming for — a blank class, or
 * a Paladin/Ranger below 4th. A Fighter's line is a statement of fact instead,
 * and callers that already have something on the page (the gnome's racial
 * spells) drop it rather than tell the player to make a choice they made.
 *
 * @param {string} playerClass
 * @returns {{text: string, pending: boolean}}
 */
export function getNoSpellbookHint(playerClass) {
  if (!playerClass) {
    return { text: 'Select a spellcasting class (and level 4+ for Paladin/Ranger).', pending: true };
  }
  if (['Ranger', 'Paladin'].includes(playerClass)) {
    return { text: `A ${playerClass} gains spells at 4th level.`, pending: true };
  }
  if (CASTER_CLASSES.includes(playerClass)) return { text: '', pending: false };
  return { text: `A ${playerClass} has no spellcasting.`, pending: false };
}

export default function SpellbookTable({ source = 'app' }) {
  const dispatch = useDispatch();
  const isApp = source === 'app';

  const appData = useSpellbookData();
  const playerData = usePlayerSpellbookData();

  const data = isApp ? appData : playerData;
  const player = useSelector(state => state.playerSheet.player);
  const playerSpellbookPage = useSelector(state => state.playerSheet.playerSpellbookPage);
  const hasUsedGnomeSpells = !isApp && player?.getRace?.() === 'Gnome' && Object.values(player.getGnomeSpellUses?.() ?? {}).some(n => n > 0);
  const showShortDescriptions = useSelector(state =>
    isApp ? state.spellbook.showShortDescriptions : state.playerSheet.playerSpellbookShowShortDescriptions
  );

  const spellbook = data.spellbook;
  const page = data.page;
  const isCollapsed = data.isCollapsed;
  const filters = data.filters;
  const spellsByLevel = data.spellsByLevel;
  const levels = data.levels;
  const spontaneousByLevel = data.spontaneousByLevel;
  const domainByLevel = data.domainByLevel;
  const preparedDomainByLevel = data.preparedDomainByLevel;
  const classDesc = data.classDesc;
  const domainDesc = data.domainDesc;
  const hasUsedSpells = data.hasUsedSpells;
  const inst = data.inst;
  const spellsPerDay = data.spellsPerDay;
  const charBonus = data.charBonus;

  const actions = isApp
    ? {
        onLearnUnlearnSpell: (link) => dispatch(onLearnUnlearnSpell(link)),
        onPrepareSpell: (link) => dispatch(onPrepareSpell(link)),
        onUnprepareSpell: (link) => dispatch(onUnprepareSpell(link)),
        onUseSpell: (link) => dispatch(onUseSpell(link)),
        onRefreshSpell: () => dispatch(onRefreshSpell()),
        onPrepareDomainSpell: (level, link) => dispatch(onPrepareDomainSpell(level, link)),
        onUnprepareDomainSpell: (level, link) => dispatch(onUnprepareDomainSpell(level, link)),
        onUseDomainSpell: (link) => dispatch(onUseDomainSpell(link)),
      }
    : {
        onLearnUnlearnSpell: (link) => dispatch(onPlayerLearnUnlearnSpell(link)),
        onPrepareSpell: (link) => dispatch(onPlayerPrepareSpell(link)),
        onUnprepareSpell: (link) => dispatch(onPlayerUnprepareSpell(link)),
        onUseSpell: (link) => dispatch(onPlayerUseSpell(link)),
        onRefreshSpell: () => dispatch(onPlayerRefreshSpell()),
        onPrepareDomainSpell: (level, link) => dispatch(onPlayerPrepareDomainSpell(level, link)),
        onUnprepareDomainSpell: (level, link) => dispatch(onPlayerUnprepareDomainSpell(level, link)),
        onUseDomainSpell: (link) => dispatch(onPlayerUseDomainSpell(link)),
      };

  const setPage = isApp
    ? (p) => dispatch(setSpellbookPage(p))
    : (p) => dispatch(setPlayerSpellbookPage(p));
  const setLevelCollapsed = isApp
    ? (arr) => dispatch(setIsSpellTableCollapsed(arr))
    : (arr) => dispatch(setPlayerSpellbookLevelCollapsed(arr));
  const setClassDescCollapsed = isApp
    ? (v) => dispatch(setIsClassDescriptionCollapsed(v))
    : (v) => dispatch(setPlayerSpellbookClassDescCollapsed(v));
  const setDomainDescCollapsed = isApp
    ? (v) => dispatch(setIsDomainDescriptionCollapsed(v))
    : (v) => dispatch(setPlayerSpellbookDomainDescCollapsed(v));
  const wizardSchoolsCollapsed = useSelector(s => s.playerSheet.playerSpellbookWizardSchoolsCollapsed ?? true);
  const setWizardSchoolsCollapsed = (v) => dispatch(setPlayerSpellbookWizardSchoolsCollapsed(v));
  const setSearchName = isApp
    ? (v) => dispatch(setSearchSpellName(v))
    : (v) => dispatch(setPlayerSpellbookSearchName(v));
  const setSearchSchool = isApp
    ? (v) => dispatch(setSearchSpellSchool(v))
    : (v) => dispatch(setPlayerSpellbookSearchSchool(v));

  if (!spellbook?.Class) {
    const hint = isApp
      ? { text: 'Create a new player and select his class to make a spellbook.', pending: true }
      : getNoSpellbookHint(player?.getClass?.() ?? '');
    if (!isApp && playerSpellbookPage === 2 && player?.getRace?.() === 'Gnome') {
      // The gnome's racial spells are the page's content here, so the hint is
      // only worth a line when a class spellbook is still coming.
      return (
        <>
          {hint.pending && <p className="search-hint">{hint.text}</p>}
          <RestBox
            page={2}
            hasUsedSpells={hasUsedGnomeSpells}
            onRefreshSpell={actions.onRefreshSpell}
          />
          <GnomeSpellsCard />
        </>
      );
    }
    return hint.text ? <p className="search-hint">{hint.text}</p> : null;
  }

  // A wild-shaped druid loses speech, so verbal components fail and she cannot
  // cast — unless she has Natural Spell. Slot counts stay visible and preparing
  // still works; only the cast button locks, with the reason stated once above.
  const castingBlocked = !isApp && player?.canCastSpells?.() === false;
  const castingBlockedReason = 'No speech in animal form — Natural Spell removes this';

  return (
    <>
      <SpellbookTableHeader
        spellbook={spellbook}
        page={page}
      />

      <SpellFilters
        filters={filters}
        onClearSearchName={() => setSearchName('')}
        onClearSearchSchool={() => setSearchSchool('')}
      />

      <RestBox
        page={page}
        hasUsedSpells={hasUsedSpells || hasUsedGnomeSpells}
        onRefreshSpell={actions.onRefreshSpell}
      />

      <ClassDescriptionCard
        className={spellbook.Class}
        description={classDesc}
        collapsed={isCollapsed.classDesc}
        toggle={() => setClassDescCollapsed(!isCollapsed.classDesc)}
      />

      {spellbook?.Class === 'Cleric' && (
        (!isApp || spellbook?.Domain1 || spellbook?.Domain2) &&
        <DomainDescriptionCard
          description={domainDesc}
          collapsed={isCollapsed.domainDesc}
          toggle={() => setDomainDescCollapsed(!isCollapsed.domainDesc)}
          showDomainDropdowns={!isApp}
          inst={!isApp ? inst : null}
          player={!isApp ? player : null}
          setOption={!isApp ? (key, value) => dispatch(onSetPlayerSpellOption(key, value)) : undefined}
        />
      )}

      {spellbook?.Class === 'Wizard' && (
        <WizardSchoolsCard
          inst={inst}
          player={isApp
            ? { specialized: inst.Specialized, forbidden1: inst.Forbidden1, forbidden2: inst.Forbidden2 }
            : player}
          setOption={isApp
            ? (key, value) => {
                if (key === 'specialized') dispatch(onSpecializedChange(value));
                else if (key === 'forbidden1') dispatch(onForbidden1Change(value));
                else if (key === 'forbidden2') dispatch(onForbidden2Change(value));
              }
            : (key, value) => dispatch(onSetPlayerSpellOption(key, value))}
          collapsed={wizardSchoolsCollapsed}
          toggle={() => setWizardSchoolsCollapsed(!wizardSchoolsCollapsed)}
        />
      )}

      {!isApp && page === 2 && player?.getRace?.() === 'Gnome' && <GnomeSpellsCard />}

      {/* Reminders sit immediately above the spell tables, where the thing
          they are about is — not above the filters and class description,
          where they read as page furniture. */}
      {castingBlocked && (
        <div className="card card-width-spellbook wild-shape-cast-block">
          <span className="material-symbols-outlined">auto_fix_off</span>
          <span>
            Wild-shaped as <b>{player.getWildShapeName()}</b> — you cannot cast.
            An animal form has no speech, so verbal components fail. The{' '}
            <b>Natural Spell</b> feat removes this restriction.
          </span>
        </div>
      )}

      {page === 0 && <SpellSwapNote inst={inst} />}

      {levels.map(lvl => (
        <SpellLevelCard
          key={lvl}
          level={lvl}
          spells={spellsByLevel[lvl]}
          spontaneousSpells={spontaneousByLevel[lvl]}
          domainSpells={domainByLevel[lvl]}
          preparedDomainSpells={preparedDomainByLevel[lvl]}
          collapsed={isCollapsed.levels[lvl]}
          toggle={() => setLevelCollapsed(isCollapsed.levels.map((x, i) => i !== lvl ? x : !x))}
          page={page}
          inst={inst}
          spellsPerDay={spellsPerDay}
          charBonus={charBonus}
          showShortDescriptions={showShortDescriptions}
          castingBlocked={castingBlocked}
          castingBlockedReason={castingBlockedReason}
          actions={actions}
          dispatch={dispatch}
        />
      ))}
    </>
  );
}
