import * as db from '../../lib/storage';
import { filterBestiary, pickRandomCreature } from '../../lib/monster/monsterBook';
import { filtersToTuple } from '../../lib/monster/monsterFilters';
import {
  addToRoster,
  addIndividual,
  removeIndividual,
  removeEntry,
  updateEntry,
  rosterToTuples,
  findRosterIndex,
} from '../../lib/monster/monsterRoster';
import {
  setMonsterFilters,
  setMonsterResults,
  setMonsterRoster,
  setMonsterOpenIndex,
} from '../slices/monsterBookSlice';
import { setPersist } from '../slices/persistSlice';

/** Write the filter tuple straight through to localStorage. */
function persistFilters(dispatch, getState) {
  const { persist, monsterBook } = getState();
  if (!persist) return;
  const next = { ...persist, mbf: filtersToTuple(monsterBook.filters) };
  db.saveApp(next);
  dispatch(setPersist(next));
}

/** Write the roster and which entry is open straight through to localStorage. */
function persistRoster(dispatch, getState) {
  const { persist, monsterBook } = getState();
  if (!persist) return;
  const next = {
    ...persist,
    mbr: rosterToTuples(monsterBook.roster),
    mbo: monsterBook.openIndex == null ? -1 : monsterBook.openIndex,
  };
  db.saveApp(next);
  dispatch(setPersist(next));
}

/** Change one or more filter fields. */
export const onSetMonsterFilters = (patch) => (dispatch, getState) => {
  dispatch(setMonsterFilters(patch));
  persistFilters(dispatch, getState);
};

/** Run the search and show the matching list. */
export const onSearchMonsters = () => (dispatch, getState) => {
  const { filters } = getState().monsterBook;
  dispatch(setMonsterResults(filterBestiary(filters)));
  // Leaving a sheet open would hide the list the master just asked for.
  dispatch(setMonsterOpenIndex(null));
  persistRoster(dispatch, getState);
};

/**
 * Put a creature on the roster.
 *
 * This is what both the Random button and the button on a search row now do.
 * They used to open the creature's sheet directly, which threw away whatever
 * was already being tracked — so adding a second monster to a fight lost the
 * first one's hit points. Adding a creature already on the roster gives it
 * another individual rather than a second entry.
 *
 * @returns {{added: boolean, reason: string, index: number}} so the caller can
 *   flag a refused ceiling instead of appearing to do nothing.
 */
export const onAddMonsterToRoster = (ref) => (dispatch, getState) => {
  const { roster } = getState().monsterBook;
  const result = addToRoster(roster, ref);
  if (!result.added) return result;
  dispatch(setMonsterRoster(result.roster));
  persistRoster(dispatch, getState);
  return result;
};

/** Pick one matching creature at random and add it to the roster. */
export const onRandomMonster = () => (dispatch, getState) => {
  const { filters } = getState().monsterBook;
  const creature = pickRandomCreature(filters);
  if (!creature) {
    // Nothing matches: show the (empty) list so the master sees why.
    dispatch(setMonsterResults([]));
    return { added: false, reason: 'unknown', index: -1 };
  }
  return dispatch(onAddMonsterToRoster(creature.ref));
};

/** Open one roster entry's sheet. */
export const onOpenRosterEntry = (index) => (dispatch, getState) => {
  dispatch(setMonsterOpenIndex(index));
  persistRoster(dispatch, getState);
};

/** Open a creature's sheet by ref, adding it to the roster if it is not on it. */
export const onOpenMonsterSheet = (ref) => (dispatch, getState) => {
  const existing = findRosterIndex(getState().monsterBook.roster, ref);
  if (existing >= 0) return dispatch(onOpenRosterEntry(existing));
  const result = dispatch(onAddMonsterToRoster(ref));
  if (result?.added) dispatch(onOpenRosterEntry(result.index));
  return result;
};

/** Close the sheet and go back to the list. */
export const onCloseMonsterSheet = () => (dispatch, getState) => {
  dispatch(setMonsterOpenIndex(null));
  persistRoster(dispatch, getState);
};

/** Another individual of one entry. */
export const onAddIndividual = (entryIndex) => (dispatch, getState) => {
  const { roster } = getState().monsterBook;
  const result = addIndividual(roster, entryIndex);
  if (!result.added) return result;
  dispatch(setMonsterRoster(result.roster));
  persistRoster(dispatch, getState);
  return result;
};

/**
 * Delete one individual. When it was the last of its kind the whole entry goes
 * with it, which is what deleting the last health bar is meant to do — and the
 * slice closes the sheet if that entry was the one open.
 */
export const onRemoveIndividual = (entryIndex, individualIndex) => (dispatch, getState) => {
  const { roster } = getState().monsterBook;
  const { roster: next } = removeIndividual(roster, entryIndex, individualIndex);
  dispatch(setMonsterRoster(next));
  persistRoster(dispatch, getState);
};

/** Drop a whole entry, however many individuals it holds. */
export const onRemoveRosterEntry = (entryIndex) => (dispatch, getState) => {
  const { roster } = getState().monsterBook;
  dispatch(setMonsterRoster(removeEntry(roster, entryIndex)));
  persistRoster(dispatch, getState);
};

/**
 * Apply a mutation to one roster entry. The roster is rebuilt from clones so
 * the store never holds a mutated instance — a component comparing by
 * reference would otherwise miss the change and skip its re-render.
 */
function mutateEntry(dispatch, getState, entryIndex, mutate) {
  const { roster } = getState().monsterBook;
  if (entryIndex == null || !roster[entryIndex]) return;
  dispatch(setMonsterRoster(updateEntry(roster, entryIndex, mutate)));
  persistRoster(dispatch, getState);
}

/* The open entry is what the sheet's own controls act on. Each takes the
   individual it applies to, since damage is the one thing per-creature —
   everything else on the sheet is shared by every individual of that kind. */
export const onAdjustMonsterHp = (delta, individualIndex = 0) => (dispatch, getState) =>
  mutateEntry(dispatch, getState, getState().monsterBook.openIndex,
    (sheet) => sheet.adjustHp(delta, individualIndex));

export const onResetMonsterHp = () => (dispatch, getState) =>
  mutateEntry(dispatch, getState, getState().monsterBook.openIndex,
    (sheet) => sheet.resetAllHp());

export const onResetIndividualHp = (individualIndex) => (dispatch, getState) =>
  mutateEntry(dispatch, getState, getState().monsterBook.openIndex,
    (sheet) => sheet.resetHp(individualIndex));

export const onSetMonsterMaxLife = (value) => (dispatch, getState) =>
  mutateEntry(dispatch, getState, getState().monsterBook.openIndex,
    (sheet) => sheet.setMaxLife(value));

export const onSetMonsterBonus = (key, value) => (dispatch, getState) =>
  mutateEntry(dispatch, getState, getState().monsterBook.openIndex,
    (sheet) => sheet.setBonus(key, value));
