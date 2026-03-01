import { useDispatch, useSelector } from 'react-redux';
import SpellbookTableHeader from './spellbook_header';
import SpellFilters from './spell_filters';
import RestBox from './rest_box';
import ClassDescriptionCard from './class_description';
import DomainDescriptionCard from './domain_description';
import SpellLevelCard from './spell_level';
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
} from '../../store/thunks/playerSheetThunks';
import '../../style/shop_inventory.css';

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
  const setSearchName = isApp
    ? (v) => dispatch(setSearchSpellName(v))
    : (v) => dispatch(setPlayerSpellbookSearchName(v));
  const setSearchSchool = isApp
    ? (v) => dispatch(setSearchSpellSchool(v))
    : (v) => dispatch(setPlayerSpellbookSearchSchool(v));

  if (!spellbook?.Class) {
    if (!isApp && playerSpellbookPage === 2 && player?.getRace?.() === 'Gnome') {
      return (
        <>
          <p className="search-hint">
            Select a spellcasting class (and level 4+ for Paladin/Ranger) to see class spellbook.
          </p>
          <RestBox
            page={2}
            hasUsedSpells={hasUsedGnomeSpells}
            onRefreshSpell={actions.onRefreshSpell}
          />
          <GnomeSpellsCard />
        </>
      );
    }
    return (
      <p className="search-hint">
        {isApp
          ? 'Create a new player and select his class to make a spellbook.'
          : 'Select a spellcasting class (and level 4+ for Paladin/Ranger).'}
      </p>
    );
  }

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

      {spellbook?.Class === 'Cleric'
        && (spellbook?.Domain1 || spellbook?.Domain2)
        && <DomainDescriptionCard
          description={domainDesc}
          collapsed={isCollapsed.domainDesc}
          toggle={() => setDomainDescCollapsed(!isCollapsed.domainDesc)}
        />}

      {!isApp && page === 2 && player?.getRace?.() === 'Gnome' && <GnomeSpellsCard />}

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
          actions={actions}
          dispatch={dispatch}
        />
      ))}
    </>
  );
}
