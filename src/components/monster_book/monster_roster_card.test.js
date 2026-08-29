import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import monsterBookReducer from '../../store/slices/monsterBookSlice';
import persistReducer from '../../store/slices/persistSlice';
import appReducer from '../../store/slices/appSlice';
import MonsterRosterCard from './monster_roster_card';
import MonsterBookPage from './monster_book_page';
import MonsterList from './monster_list';
import {
  onAddMonsterToRoster,
  onOpenRosterEntry,
  onRemoveIndividual,
  onAddIndividual,
  onAdjustMonsterHp,
  onCloseMonsterSheet,
  onSetMonsterBonus,
} from '../../store/thunks/monsterBookThunks';
import { listBestiary } from '../../lib/monster/monsterBook';
import { MAX_INDIVIDUALS } from '../../lib/monster/monsterSheet';

/* The roster card, and the tab around it.
 *
 * Before this the Monster Book tracked exactly one creature: opening a second
 * stat block silently threw the first one's hit points away. These tests are
 * mostly about the two things that replaced that — a list of kinds, and a row
 * per individual inside each.
 */

let CREATURES;
beforeAll(() => { CREATURES = listBestiary().slice(0, 3); });

function makeStore() {
  return configureStore({
    reducer: {
      monsterBook: monsterBookReducer,
      persist: persistReducer,
      app: appReducer,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
}

/** A store with `refs` already added, in order. */
function storeWith(...refs) {
  const store = makeStore();
  refs.forEach((ref) => store.dispatch(onAddMonsterToRoster(ref)));
  return store;
}

const renderIn = (store, node) => render(<Provider store={store}>{node}</Provider>);

describe('when the card shows at all', () => {
  test('not at all with an empty roster', () => {
    const { container } = renderIn(makeStore(), <MonsterRosterCard />);
    expect(container).toBeEmptyDOMElement();
  });

  test('one creature gets a name, a bar and its numbers', () => {
    const store = storeWith(CREATURES[0].ref);
    renderIn(store, <MonsterRosterCard />);
    expect(screen.getByText('Roster')).toBeInTheDocument();
    expect(screen.getByText(CREATURES[0].name)).toBeInTheDocument();
    const sheet = store.getState().monsterBook.roster[0];
    expect(screen.getByText(`${sheet.getMaxLife()} / ${sheet.getMaxLife()}`)).toBeInTheDocument();
  });

  test('the heading counts kinds and creatures separately', () => {
    const store = storeWith(CREATURES[0].ref, CREATURES[0].ref, CREATURES[1].ref);
    renderIn(store, <MonsterRosterCard />);
    expect(screen.getByText(/2 \/ 10 kinds · 3 creatures/)).toBeInTheDocument();
  });

  test('one creature reads as singular', () => {
    renderIn(storeWith(CREATURES[0].ref), <MonsterRosterCard />);
    expect(screen.getByText(/1 creature$/)).toBeInTheDocument();
  });
});

describe('one row per individual', () => {
  test('three goblins are three bars under one name', () => {
    const ref = CREATURES[0].ref;
    const store = storeWith(ref, ref, ref);
    const { container } = renderIn(store, <MonsterRosterCard />);
    expect(screen.getAllByText(CREATURES[0].name)).toHaveLength(1);
    expect(container.querySelectorAll('.roster-hp')).toHaveLength(3);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  test('the count pill only appears once there is more than one', () => {
    const ref = CREATURES[0].ref;
    renderIn(storeWith(ref), <MonsterRosterCard />);
    expect(screen.queryByText('×2')).toBe(null);
  });

  test('and says how many when there is', () => {
    const ref = CREATURES[0].ref;
    renderIn(storeWith(ref, ref), <MonsterRosterCard />);
    expect(screen.getByText('×2')).toBeInTheDocument();
  });

  test('each row carries its own delete', () => {
    const ref = CREATURES[0].ref;
    const name = CREATURES[0].name;
    renderIn(storeWith(ref, ref), <MonsterRosterCard />);
    expect(screen.getByRole('button', { name: `Remove ${name} #1` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Remove ${name} #2` })).toBeInTheDocument();
  });

  test('the only one says it removes the whole entry', () => {
    renderIn(storeWith(CREATURES[0].ref), <MonsterRosterCard />);
    expect(
      screen.getByRole('button', { name: `Remove ${CREATURES[0].name} from the roster` })
    ).toBeInTheDocument();
  });
});

describe('deleting', () => {
  test('one of three leaves two', () => {
    const ref = CREATURES[0].ref;
    const store = storeWith(ref, ref, ref);
    store.dispatch(onRemoveIndividual(0, 1));
    expect(store.getState().monsterBook.roster[0].getCount()).toBe(2);
  });

  test('the last one takes the entry off the roster', () => {
    const store = storeWith(CREATURES[0].ref, CREATURES[1].ref);
    store.dispatch(onRemoveIndividual(0, 0));
    const { roster } = store.getState().monsterBook;
    expect(roster).toHaveLength(1);
    expect(roster[0].getRef()).toBe(CREATURES[1].ref);
  });

  test('and closes the sheet if that entry was the one open', () => {
    const store = storeWith(CREATURES[0].ref);
    store.dispatch(onOpenRosterEntry(0));
    expect(store.getState().monsterBook.openIndex).toBe(0);
    store.dispatch(onRemoveIndividual(0, 0));
    expect(store.getState().monsterBook.openIndex).toBe(null);
  });

  test('the button removes the right one, by its damage', () => {
    const ref = CREATURES[0].ref;
    const name = CREATURES[0].name;
    const store = storeWith(ref, ref);
    store.dispatch(onOpenRosterEntry(0));
    store.dispatch(onAdjustMonsterHp(-6, 0));
    expect(store.getState().monsterBook.roster[0].getDamage(0)).toBe(6);
    renderIn(store, <MonsterRosterCard />);
    fireEvent.click(screen.getByRole('button', { name: `Remove ${name} #1` }));
    const entry = store.getState().monsterBook.roster[0];
    expect(entry.getCount()).toBe(1);
    expect(entry.getDamage(0)).toBe(0);
  });
});

describe('a creature at zero stays on the roster', () => {
  test('the row remains, marked as down', () => {
    const store = storeWith(CREATURES[0].ref);
    store.dispatch(onOpenRosterEntry(0));
    const max = store.getState().monsterBook.roster[0].getMaxLife();
    store.dispatch(onAdjustMonsterHp(-max, 0));
    const { container } = renderIn(store, <MonsterRosterCard />);
    expect(container.querySelectorAll('.roster-hp')).toHaveLength(1);
    expect(container.querySelector('.roster-hp.is-down')).toBeTruthy();
  });
});

describe('opening a sheet', () => {
  test('the button on a row opens that entry', () => {
    const store = storeWith(CREATURES[0].ref, CREATURES[1].ref);
    renderIn(store, <MonsterRosterCard />);
    fireEvent.click(
      screen.getByRole('button', { name: `Open the combat sheet for ${CREATURES[1].name}` })
    );
    expect(store.getState().monsterBook.openIndex).toBe(1);
  });

  test('the roster stays visible above the open sheet', () => {
    const store = storeWith(CREATURES[0].ref);
    store.dispatch(onOpenRosterEntry(0));
    renderIn(store, <MonsterBookPage />);
    expect(screen.getByText('Roster')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
  });

  test('and above the search list when nothing is open', () => {
    const store = storeWith(CREATURES[0].ref);
    renderIn(store, <MonsterBookPage />);
    expect(screen.getByText('Roster')).toBeInTheDocument();
    expect(screen.queryByText('Health')).toBe(null);
  });

  test('closing returns to the list without emptying the roster', () => {
    const store = storeWith(CREATURES[0].ref);
    store.dispatch(onOpenRosterEntry(0));
    store.dispatch(onCloseMonsterSheet());
    expect(store.getState().monsterBook.openIndex).toBe(null);
    expect(store.getState().monsterBook.roster).toHaveLength(1);
  });
});

describe('the search row adds rather than opens', () => {
  function listStore() {
    const store = makeStore();
    store.dispatch({ type: 'monsterBook/setMonsterResults', payload: CREATURES });
    return store;
  }

  test('pressing it puts the creature on the roster and opens nothing', () => {
    const store = listStore();
    renderIn(store, <MonsterList />);
    fireEvent.click(
      screen.getByRole('button', { name: `Add ${CREATURES[0].name} to the roster` })
    );
    expect(store.getState().monsterBook.roster).toHaveLength(1);
    expect(store.getState().monsterBook.openIndex).toBe(null);
  });

  test('pressing it twice makes two of the same creature, not two entries', () => {
    const store = listStore();
    renderIn(store, <MonsterList />);
    const button = screen.getByRole('button', { name: `Add ${CREATURES[0].name} to the roster` });
    fireEvent.click(button);
    fireEvent.click(button);
    const { roster } = store.getState().monsterBook;
    expect(roster).toHaveLength(1);
    expect(roster[0].getCount()).toBe(2);
  });
});

describe('the ceilings', () => {
  test('a full entry refuses another and says why', () => {
    const ref = CREATURES[0].ref;
    const store = storeWith(ref);
    for (let i = 1; i < MAX_INDIVIDUALS; i += 1) store.dispatch(onAddIndividual(0));
    expect(store.getState().monsterBook.roster[0].getCount()).toBe(MAX_INDIVIDUALS);
    const refused = store.dispatch(onAddIndividual(0));
    expect(refused.added).toBe(false);
    expect(refused.reason).toBe('individuals');
  });

  test('an eleventh kind is refused, and the roster is unchanged', () => {
    const refs = listBestiary().slice(0, 11).map((c) => c.ref);
    const store = storeWith(...refs.slice(0, 10));
    expect(store.getState().monsterBook.roster).toHaveLength(10);
    const refused = store.dispatch(onAddMonsterToRoster(refs[10]));
    expect(refused.added).toBe(false);
    expect(refused.reason).toBe('entries');
    expect(store.getState().monsterBook.roster).toHaveLength(10);
  });
});

describe('what the roster writes to storage', () => {
  test('the entries and the open index both persist', () => {
    const store = storeWith(CREATURES[0].ref, CREATURES[0].ref);
    store.dispatch(onOpenRosterEntry(0));
    const { persist } = store.getState();
    expect(persist.mbr).toHaveLength(1);
    expect(persist.mbo).toBe(0);
    // ref, maxLife, six bonuses, then one damage per individual.
    expect(persist.mbr[0]).toHaveLength(2 + 6 + 2);
  });

  test('closing writes -1 rather than leaving a stale index', () => {
    const store = storeWith(CREATURES[0].ref);
    store.dispatch(onOpenRosterEntry(0));
    store.dispatch(onCloseMonsterSheet());
    expect(store.getState().persist.mbo).toBe(-1);
  });
});

describe('the individuals share one sheet', () => {
  test('a bonus set on the sheet applies to all of them', () => {
    const ref = CREATURES[0].ref;
    const store = storeWith(ref, ref);
    store.dispatch(onOpenRosterEntry(0));
    const entry = () => store.getState().monsterBook.roster[0];
    expect(entry().getCount()).toBe(2);
    const before = entry().getArmorClass();
    store.dispatch(onSetMonsterBonus('ac', 3));
    expect(entry().getArmorClass()).toBe(before + 3);
  });

  test('but hurting one leaves the other untouched', () => {
    const ref = CREATURES[0].ref;
    const store = storeWith(ref, ref);
    store.dispatch(onOpenRosterEntry(0));
    store.dispatch(onAdjustMonsterHp(-5, 1));
    const entry = store.getState().monsterBook.roster[0];
    expect(entry.getDamage(0)).toBe(0);
    expect(entry.getDamage(1)).toBe(5);
  });
});

describe('the health card on the sheet', () => {
  test('one row per individual, each with its own controls', () => {
    const ref = CREATURES[0].ref;
    const store = storeWith(ref, ref);
    store.dispatch(onOpenRosterEntry(0));
    const { container } = renderIn(store, <MonsterBookPage />);
    expect(container.querySelectorAll('.monster-hp-row')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Decrease HP of #1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Increase HP of #2' })).toBeInTheDocument();
  });

  test('removing is the roster card’s job, never the sheet’s', () => {
    /* The same action in two places, and one of them able to pull the page
       out from under the reader. Deleting lives on the roster, where the
       whole encounter is visible. */
    const ref = CREATURES[0].ref;
    const store = storeWith(ref, ref);
    store.dispatch(onOpenRosterEntry(0));
    const { container } = renderIn(store, <MonsterBookPage />);
    const sheetRows = [...container.querySelectorAll('.monster-hp-row')];
    expect(sheetRows).toHaveLength(2);
    sheetRows.forEach((row) => {
      expect(within(row).queryByRole('button', { name: /^Remove/ })).toBeNull();
    });
    // The roster card above it still has one per individual.
    expect(screen.getAllByRole('button', { name: /^Remove .* #\d/ })).toHaveLength(2);
  });

  test('a single creature keeps the plain unnumbered controls', () => {
    const store = storeWith(CREATURES[0].ref);
    store.dispatch(onOpenRosterEntry(0));
    renderIn(store, <MonsterBookPage />);
    expect(screen.getByRole('button', { name: 'Decrease HP' })).toBeInTheDocument();
  });

  test('the plus adds another health bar', () => {
    const store = storeWith(CREATURES[0].ref);
    store.dispatch(onOpenRosterEntry(0));
    const { container } = renderIn(store, <MonsterBookPage />);
    fireEvent.click(screen.getByRole('button', { name: `Add another ${CREATURES[0].name}` }));
    expect(store.getState().monsterBook.roster[0].getCount()).toBe(2);
    expect(container.querySelectorAll('.monster-hp-row')).toHaveLength(2);
  });

  test('hurting the second bar moves only the second', () => {
    const ref = CREATURES[0].ref;
    const store = storeWith(ref, ref);
    store.dispatch(onOpenRosterEntry(0));
    renderIn(store, <MonsterBookPage />);
    /* The HP buttons are long-press controls: they fire on mouse down/up, not
       on click, so a short press is the pair rather than a click event. */
    const minus = screen.getByRole('button', { name: 'Decrease HP of #2' });
    fireEvent.mouseDown(minus);
    fireEvent.mouseUp(minus);
    const entry = store.getState().monsterBook.roster[0];
    expect(entry.getDamage(0)).toBe(0);
    expect(entry.getDamage(1)).toBe(1);
  });

  test('the title counts creatures once there is more than one', () => {
    const ref = CREATURES[0].ref;
    const store = storeWith(ref, ref, ref);
    store.dispatch(onOpenRosterEntry(0));
    renderIn(store, <MonsterBookPage />);
    expect(screen.getByText('3 creatures')).toBeInTheDocument();
  });

  test('reset brings every one of them back to full', () => {
    const ref = CREATURES[0].ref;
    const store = storeWith(ref, ref);
    store.dispatch(onOpenRosterEntry(0));
    store.dispatch(onAdjustMonsterHp(-5, 0));
    store.dispatch(onAdjustMonsterHp(-9, 1));
    renderIn(store, <MonsterBookPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to full health' }));
    const entry = store.getState().monsterBook.roster[0];
    expect(entry.getIndividuals().map((i) => i.damage)).toEqual([0, 0]);
  });
});
