import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

import appReducer from '../../store/slices/appSlice';
import RulesPage from './rules_page';
import { preloadRules } from '../../lib/loadFile';

/* The real generated data, not a fixture.
 *
 * A fixture would pass while the generator emitted something the page cannot
 * render — an empty section body, a table, a link into another note — and
 * those are exactly the shapes worth covering. `setupTests` does not preload
 * this chunk, since only this tab uses it, so it is awaited here. */
beforeAll(() => preloadRules());

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

const search = (text) =>
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: text } });

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

  test('clearing the box returns to the topic list', () => {
    renderPage();
    search('counterspell');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText(/33 topics, condensed/)).toBeInTheDocument();
  });
});

describe('the links inside a note', () => {
  test('a link to another note navigates there instead of leaving the app', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Counterspelling/ }));
    /* counterspelling.md links to combat.md in its first section. */
    const link = screen.getAllByRole('button').find((b) => b.textContent === 'combat.md');
    expect(link).toBeTruthy();
    fireEvent.click(link);
    expect(screen.getByRole('heading', { level: 1, name: 'Combat' })).toBeInTheDocument();
  });

  test('a link into src/data opens the Search tab', () => {
    const store = renderPage();
    /* A topic button's accessible name is its title AND its blurb, and two
       topics start with "Skills" — the overview and the per-skill detail.
       Anchored on the blurb only the overview has. */
    fireEvent.click(screen.getByRole('button', { name: /^Skills Skill check resolution/ }));
    const link = screen.getAllByRole('button')
      .find((b) => /src\/data\/skills\.json$/.test(b.textContent));
    expect(link).toBeTruthy();
    fireEvent.click(link);
    expect(store.getState().app.currentTab).toBe(4);
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
