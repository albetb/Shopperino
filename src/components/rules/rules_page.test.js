import { render, screen, fireEvent, act } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

import appReducer from '../../store/slices/appSlice';
import RulesPage, { DATA_FILE_LABEL } from './rules_page';
import { preloadRules } from '../../lib/loadFile';
import { t, setLanguage } from '../../lib/i18n';

/* The real generated data, not a fixture.
 *
 * A fixture would pass while the generator emitted something the page cannot
 * render — an empty section body, a table, a link into another note — and
 * those are exactly the shapes worth covering. `setupTests` does not preload
 * this chunk, since only this tab uses it, so it is awaited here. */
beforeAll(() => preloadRules());

/* The search is debounced, so a keystroke and its results are two separate
   ticks. Faking the clock is what lets the tests stay synchronous — and what
   makes the debounce itself testable rather than merely tolerated. */
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

function renderPage() {
  const store = configureStore({
    reducer: { app: appReducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  render(
    <Provider store={store}>
      <RulesPage />
    </Provider>
  );
  return store;
}

const type = (text) =>
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: text } });

const search = (text) => {
  type(text);
  act(() => { jest.advanceTimersByTime(250); });
};

describe('the landing view', () => {
  test('lists every topic with the scope line the note opens with', () => {
    renderPage();
    expect(screen.getByText(/33 topics, condensed from the manuals/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Counterspelling/ })).toBeInTheDocument();
    expect(screen.getByText(/Disrupting an enemy spellcaster mid-cast/)).toBeInTheDocument();
  });

  test('opening a topic renders its sections, headings and prose', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Counterspelling/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'Counterspelling' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Core mechanic' })).toBeInTheDocument();
    expect(screen.getByText(/Ready an action/)).toBeInTheDocument();
  });

  test('topics are ordered by the title shown, not by the file underneath', () => {
    renderPage();
    const order = screen.getAllByRole('button').map((b) => b.textContent);
    const at = (title) => order.findIndex((name) => name.startsWith(title));
    /* Three pairs the file names get wrong: combat-maneuvers.md sorts before
       combat.md, magic-items.md before magic.md, skills-detail.md before
       skills.md. In Italian the whole list is in an order with no visible rule
       at all, since the titles are translated and the file names are not. */
    expect(at('Combat')).toBeLessThan(at('Combat Maneuvers'));
    expect(at('Magic')).toBeLessThan(at('Magic Items'));
    expect(at('Skills')).toBeLessThan(at('Skills —'));
  });

  test('a note can be left again', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Counterspelling/ }));
    fireEvent.click(screen.getByRole('button', { name: /All topics/ }));
    expect(screen.getByText(/33 topics, condensed/)).toBeInTheDocument();
  });
});

describe('search', () => {
  test('finds sections by a word in their prose, not only in a heading', () => {
    renderPage();
    search('counterspell');
    expect(screen.getByText(/sections match|section matches/)).toBeInTheDocument();
  });

  test('a hit shows the whole section, not a clipped snippet', () => {
    renderPage();
    search('opposed-pair');
    /* The section lists the pairs. A snippet around the matched word would
       carry none of them, so finding one proves the whole section is there.
       Matched on the container, because the note italicises each spell name
       and the sentence is split across those elements. */
    expect(screen.getAllByText(
      (_content, el) => /ray of enfeeblement/.test(el?.textContent ?? ''),
      { selector: 'li' },
    ).length).toBeGreaterThan(0);
  });

  test('a hit opens its note at that section', () => {
    renderPage();
    search('same-spell counter');
    const hit = screen.getAllByRole('button')
      .find((b) => /Same-spell counter/.test(b.textContent));
    fireEvent.click(hit);
    expect(screen.getByRole('heading', { level: 1, name: 'Counterspelling' })).toBeInTheDocument();
  });

  test('a query nothing matches says so and points at the Search tab', () => {
    renderPage();
    search('zzzznotarule');
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
    expect(screen.getByText(/those are on the Search tab/)).toBeInTheDocument();
  });

  test('clearing the box returns to the topic list, without waiting', () => {
    renderPage();
    search('counterspell');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    /* No timer advanced: emptying the box is a request to see the topic list
       again, and debouncing that is lag with nothing saved. */
    expect(screen.getByText(/33 topics, condensed/)).toBeInTheDocument();
  });

  test('the scan waits for a pause, but the box does not', () => {
    renderPage();
    type('counterspell');
    /* Typed, not yet searched: the caret is not held up by the scan, and the
       results for every prefix of the word are never built. */
    expect(screen.getByRole('searchbox')).toHaveValue('counterspell');
    expect(screen.getByText(/33 topics, condensed/)).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(250); });
    expect(screen.getByText(/sections match|section matches/)).toBeInTheDocument();
  });
});

describe('the links inside a note', () => {
  test('a link to another note is called by its title and navigates there', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Counterspelling/ }));
    /* counterspelling.md links to combat.md in its first section. The note
       writes the file name; the reader is shown the note's own title. */
    expect(screen.queryByRole('button', { name: 'combat.md' })).not.toBeInTheDocument();
    const link = screen.getAllByRole('button').find((b) => b.textContent === 'Combat');
    expect(link).toBeTruthy();
    fireEvent.click(link);
    expect(screen.getByRole('heading', { level: 1, name: 'Combat' })).toBeInTheDocument();
  });

  test('a link into src/data is named, and opens the Search tab', () => {
    const store = renderPage();
    /* A topic button's accessible name is its title AND its blurb, and two
       topics start with "Skills" — the overview and the per-skill detail.
       Anchored on the blurb only the overview has. */
    fireEvent.click(screen.getByRole('button', { name: /^Skills Skill check resolution/ }));
    expect(screen.queryByText(/src\/data\/skills\.json/)).not.toBeInTheDocument();
    const link = screen.getAllByRole('button')
      .find((b) => b.textContent === 'the skill list');
    expect(link).toBeTruthy();
    fireEvent.click(link);
    expect(store.getState().app.currentTab).toBe(4);
  });

  test('a reference the app cannot open is named too, and is not a button', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^Familiar/ }));
    /* familiar.md points at src/data/animals.json for the base stat blocks.
       There is no view of that file, so it stays text — but readable text. */
    expect(screen.queryByText(/src\/data\/animals\.json/)).not.toBeInTheDocument();
    const named = screen.getAllByText('the animal list');
    expect(named.length).toBeGreaterThan(0);
    named.forEach((el) => expect(el.tagName).not.toBe('BUTTON'));
  });
});

describe('the names in Italian', () => {
  afterEach(() => setLanguage('en'));

  /* Every one of these reaches the reader through a dynamic `t(label)`, which
     progress.py cannot follow — the same blind spot the tab labels have, and
     covered the same way: by naming every value the map can hand it. */
  test('every name a reference can be shown by is translated', () => {
    setLanguage('it');
    Object.values(DATA_FILE_LABEL).forEach((label) => {
      expect(t(label)).not.toBe(label);   // fell back to English
      expect(t(label).trim()).not.toBe('');
    });
  });
});

describe('what the generator promised', () => {
  test('the Sources section is not rendered — it is provenance, not a rule', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Counterspelling/ }));
    expect(screen.queryByRole('heading', { name: 'Sources' })).not.toBeInTheDocument();
  });

  test('a table survives as a table', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^Alignment/ }));
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
  });
});
