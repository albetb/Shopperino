import { render, screen, fireEvent } from '@testing-library/react';
import AddItemFormInventory from './AddItemFormInventory';
import { loadFile } from '../../../lib/loadFile';

/* Adding an item, and the one question some items make the form ask.
 *
 * A ring of energy resistance is attuned to **one** energy type when it is
 * made, and items.json cannot say which — there is one row per grade and no
 * type in the name. So the type is chosen here, at the moment the ring enters
 * the bag, and stored on the row: which also means a fire ring and a cold ring
 * are two inventory entries rather than one stack of two.
 */

/** The flattened list the inventory page hands the form, ItemType attached. */
const ALL_ITEMS = (() => {
  const data = loadFile('items');
  /* Exactly the list inventory_page flattens, and note what is *not* in it:
     scrolls live in scrolls.json, so they can only ever reach the suggestion
     list through getItem. */
  const types = ['Good', 'Ammo', 'Weapon', 'Specific Weapon', 'Armor', 'Specific Armor',
    'Shield', 'Specific Shield', 'Potion', 'Ring', 'Rod', 'Staff', 'Wand', 'Wondrous Item'];
  return types.flatMap((type) => (data[type] || []).map((row) => ({ ...row, ItemType: type })));
})();

function renderForm() {
  const added = [];
  render(
    <AddItemFormInventory
      open
      items={ALL_ITEMS}
      onAddItem={(name, type, number, link, opts) => added.push({ name, type, number, link, opts })}
      onClose={() => {}}
    />
  );
  return added;
}

/**
 * Type part of a name and pick it out of the suggestion list, as a user would.
 *
 * Deliberately a *prefix*: the list hides itself once the only match equals
 * what has been typed, so typing a name in full never offers anything to click.
 */
function pick(name) {
  const input = screen.getByPlaceholderText('Item name');
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: name.slice(0, -2) } });
  fireEvent.mouseDown(screen.getByText(name));
}

/** Type the whole name and never touch the list. */
function typeFully(name) {
  const input = screen.getByPlaceholderText('Item name');
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: name } });
}

describe('the energy type selector', () => {
  test('is absent until an item that needs it is picked', () => {
    renderForm();
    expect(screen.queryByText('Energy type')).not.toBeInTheDocument();
    pick('Cloak of resistance +1');
    expect(screen.queryByText('Energy type')).not.toBeInTheDocument();
  });

  test('appears for a ring of energy resistance', () => {
    renderForm();
    pick('Ring of Energy resistance, minor');
    expect(screen.getByText('Energy type')).toBeInTheDocument();
    ['Acid', 'Cold', 'Electricity', 'Fire', 'Sonic'].forEach((energy) => {
      expect(screen.getByRole('button', { name: energy })).toBeInTheDocument();
    });
  });

  test('appears for all three grades', () => {
    ['minor', 'major', 'greater'].forEach((grade) => {
      const { unmount } = render(
        <AddItemFormInventory open items={ALL_ITEMS} onAddItem={() => {}} onClose={() => {}} />
      );
      pick(`Ring of Energy resistance, ${grade}`);
      expect(screen.getByText('Energy type')).toBeInTheDocument();
      unmount();
    });
  });

  test('the chosen type is stored on the row', () => {
    const added = renderForm();
    pick('Ring of Energy resistance, major');
    fireEvent.click(screen.getByRole('button', { name: 'Fire' }));
    fireEvent.click(screen.getByRole('button', { name: /add_shopping_cart Add/ }));
    expect(added).toHaveLength(1);
    expect(added[0].link).toBe('items/Ring/ring-of-energy-resistance-major');
    expect(added[0].opts.overrides).toEqual({ energy: 'Fire' });
  });

  test('tapping the chosen type again clears it', () => {
    const added = renderForm();
    pick('Ring of Energy resistance, minor');
    fireEvent.click(screen.getByRole('button', { name: 'Cold' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cold' }));
    fireEvent.click(screen.getByRole('button', { name: /add_shopping_cart Add/ }));
    // Skipping it is allowed: the sheet then shows the ring with no type and
    // says so, rather than guessing one.
    expect(added[0].opts?.overrides).toBeUndefined();
  });

  test('a name typed in full still gets its link, and its selector', () => {
    /* The suggestion list hides once the only match equals what was typed, so
       this path never clicked anything — and the row went in with no link at
       all, carrying no effect and no info card. */
    const added = renderForm();
    typeFully('Ring of Energy resistance, greater');
    expect(screen.getByText('Energy type')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Acid' }));
    fireEvent.click(screen.getByRole('button', { name: /add_shopping_cart Add/ }));
    expect(added[0].link).toBe('items/Ring/ring-of-energy-resistance-greater');
    expect(added[0].opts.overrides).toEqual({ energy: 'Acid' });
  });

  test('an ordinary item typed in full gets its link too', () => {
    const added = renderForm();
    typeFully('Cloak of resistance +1');
    fireEvent.click(screen.getByRole('button', { name: /add_shopping_cart Add/ }));
    expect(added[0].link).toBe('items/Wondrous Item/cloak-of-resistance-1');
  });

  test('picking a different item afterwards clears the choice', () => {
    const added = renderForm();
    pick('Ring of Energy resistance, minor');
    fireEvent.click(screen.getByRole('button', { name: 'Sonic' }));
    pick('Cloak of resistance +1');
    expect(screen.queryByText('Energy type')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /add_shopping_cart Add/ }));
    expect(added[0].opts?.overrides).toBeUndefined();
  });
});

describe('searching for a scroll', () => {
  /** Every suggestion row's text, in order. */
  const rows = () => [...document.querySelectorAll('.suggestion-item')].map((li) => li.textContent);

  const search = (text) => {
    const input = screen.getByPlaceholderText('Item name');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: text } });
  };

  test('finds one without the Scroll type being selected first', () => {
    /* The bug: scrolls are in scrolls.json, absent from the flattened list,
       and getItem returns them only for the 'Scroll' type — so a player had
       to change the dropdown before searching, which is knowing the answer
       before asking the question. */
    renderForm();
    expect(screen.getByRole('combobox')).toHaveValue('Good');
    search('Fireball');
    expect(rows().some((t) => t.startsWith('Scroll of Fireball'))).toBe(true);
  });

  test('finds it alongside items of other types with the same spell', () => {
    renderForm();
    search('Cure light wounds');
    const text = rows().join('|');
    expect(text).toMatch(/Potion of Cure light wounds/);
    expect(text).toMatch(/Scroll of Cure light wounds/);
  });

  test('names the list a scroll came from, so the two copies differ', () => {
    /* 151 spells are on both lists under the same name, and they can sit at
       different spell levels — which is what decides who may read them. */
    renderForm();
    search('Scroll of Detect magic');
    const detect = rows().filter((t) => t.startsWith('Scroll of Detect magic'));
    expect(detect).toHaveLength(2);
    expect(detect.some((t) => t.includes('Arcane'))).toBe(true);
    expect(detect.some((t) => t.includes('Divine'))).toBe(true);
  });

  test('an ordinary item carries no source label', () => {
    // A prefix: the list hides once the only match equals what was typed.
    renderForm();
    search('Cloak of resistance +');
    expect(rows()).toContain('Cloak of resistance +1');
    expect(rows().join('|')).not.toMatch(/Arcane|Divine/);
  });

  test('picking one sets the type and the full scroll ref', () => {
    const added = renderForm();
    search('Scroll of Fireba');
    fireEvent.mouseDown(screen.getByText('Scroll of Fireball'));
    fireEvent.click(screen.getByRole('button', { name: /add_shopping_cart Add/ }));
    expect(added[0].type).toBe('Scroll');
    expect(added[0].link).toBe('scrolls/Arcane/fireball');
  });

  test('the list is capped, and says how much it is hiding', () => {
    /* Every scroll name begins with "Scroll of", so a short query matches all
       752 of them. A dropdown that long is worse than no dropdown. */
    renderForm();
    search('Scroll of');
    expect(document.querySelectorAll('.suggestion-item--more')).toHaveLength(1);
    expect(rows().length).toBeLessThanOrEqual(41);
    expect(rows().join('|')).toMatch(/more — keep typing to narrow it/);
  });

  test('a narrow query shows everything and no hint', () => {
    renderForm();
    search('Scroll of Fireball');
    expect(document.querySelectorAll('.suggestion-item--more')).toHaveLength(0);
  });
});
