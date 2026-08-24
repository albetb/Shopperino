import * as db from '../../lib/storage';
import MonsterSheet from '../../lib/monster/monsterSheet';
import { filterBestiary, pickRandomCreature } from '../../lib/monster/monsterBook';
import { filtersToTuple } from '../../lib/monster/monsterFilters';
import {
  setMonsterFilters,
  setMonsterResults,
  setMonsterSheet,
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

/** Write the open sheet — or its absence — straight through to localStorage. */
function persistSheet(dispatch, getState) {
  const { persist, monsterBook } = getState();
  if (!persist) return;
  const sheet = monsterBook.sheet;
  const next = { ...persist, mbs: sheet ? sheet.serialize() : [] };
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
  // Leaving the sheet open would hide the list the master just asked for.
  dispatch(setMonsterSheet(null));
  persistSheet(dispatch, getState);
};

/** Pick one matching creature at random and open its sheet directly. */
export const onRandomMonster = () => (dispatch, getState) => {
  const { filters } = getState().monsterBook;
  const creature = pickRandomCreature(filters);
  if (!creature) {
    // Nothing matches: show the (empty) list so the master sees why.
    dispatch(setMonsterResults([]));
    return;
  }
  dispatch(setMonsterSheet(new MonsterSheet(creature.ref)));
  persistSheet(dispatch, getState);
};

/** Open one creature's sheet by ref. */
export const onOpenMonsterSheet = (ref) => (dispatch, getState) => {
  const sheet = new MonsterSheet(ref);
  if (!sheet.isValid()) return;
  dispatch(setMonsterSheet(sheet));
  persistSheet(dispatch, getState);
};

/** Close the sheet and go back to the list. */
export const onCloseMonsterSheet = () => (dispatch, getState) => {
  dispatch(setMonsterSheet(null));
  persistSheet(dispatch, getState);
};

/**
 * Apply a mutation to the open sheet. The sheet is cloned first so the store
 * never holds a mutated instance — a component comparing by reference would
 * otherwise miss the change and skip its re-render.
 */
function updateSheet(dispatch, getState, mutate) {
  const current = getState().monsterBook.sheet;
  if (!current) return;
  const next = current.clone();
  if (!next) return;
  mutate(next);
  dispatch(setMonsterSheet(next));
  persistSheet(dispatch, getState);
}

export const onAdjustMonsterHp = (delta) => (dispatch, getState) =>
  updateSheet(dispatch, getState, (sheet) => sheet.adjustHp(delta));

export const onResetMonsterHp = () => (dispatch, getState) =>
  updateSheet(dispatch, getState, (sheet) => sheet.resetHp());

export const onSetMonsterMaxLife = (value) => (dispatch, getState) =>
  updateSheet(dispatch, getState, (sheet) => sheet.setMaxLife(value));

export const onSetMonsterBonus = (key, value) => (dispatch, getState) =>
  updateSheet(dispatch, getState, (sheet) => sheet.setBonus(key, value));
