import { render, screen, fireEvent } from '@testing-library/react';
import Spellbook from '../../lib/spellbook';
import SpellSwapNote from './spell_swap_note';

/* The swap tally. Learning stays free here, so the counter is a record the
   player keeps rather than a lock — which means it has to accept a count past
   what the level earned and say so, per the non-enforcing rule in CLAUDE.md. */

function caster({ cls = 'Sorcerer', level = 10, used = 0 } = {}) {
  const book = new Spellbook();
  book.Name = 'Test';
  book.setClass(cls);
  book.Level = level;
  book.setSpellSwapsUsed(used);
  return book;
}

describe('the head, which is all a collapsed card shows', () => {
  test('carries the tally of used against earned', () => {
    const book = caster({ level: 10, used: 2 });
    render(<SpellSwapNote inst={book} />);
    expect(screen.getByText(`2 / ${book.getSpellSwapsEarned()}`)).toBeInTheDocument();
  });

  test('the body is hidden until the head is pressed', () => {
    render(<SpellSwapNote inst={caster()} />);
    expect(screen.queryByText(/may trade one known spell/i)).toBe(null);
    fireEvent.click(screen.getByText('Spell swaps'));
    expect(screen.getByText(/may trade one known spell/i)).toBeInTheDocument();
  });
});

describe('the counter', () => {
  test('reports a new count rather than changing it itself', () => {
    const onSetSwapsUsed = jest.fn();
    render(<SpellSwapNote inst={caster({ used: 1 })} onSetSwapsUsed={onSetSwapsUsed} />);
    fireEvent.click(screen.getByText('Spell swaps'));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Increment' }));
    expect(onSetSwapsUsed).toHaveBeenCalledWith(2);
  });

  test('going over what the level earned is accepted and flagged, not blocked', () => {
    const book = caster({ level: 10 });
    const earned = book.getSpellSwapsEarned();
    book.setSpellSwapsUsed(earned + 2);
    // The model took the over-count rather than clamping it.
    expect(book.getSpellSwapsUsed()).toBe(earned + 2);
    render(<SpellSwapNote inst={book} />);
    fireEvent.click(screen.getByText('Spell swaps'));
    expect(screen.getByText(/2 more than this level has earned/i)).toBeInTheDocument();
  });
});

describe('what counts as earned', () => {
  test('one per swap level already reached', () => {
    const book = caster({ level: 10 });
    const levels = book.getSpellSwapLevels();
    expect(levels.length).toBeGreaterThan(0);
    expect(book.getSpellSwapsEarned()).toBe(levels.filter((l) => l <= 10).length);
  });

  test('a class with no swap levels renders nothing at all', () => {
    const { container } = render(<SpellSwapNote inst={caster({ cls: 'Wizard' })} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('the count survives a save and reload', () => {
  test('and costs nothing in storage while it is zero', () => {
    const book = caster({ level: 10, used: 3 });
    const reloaded = new Spellbook().load(book.serialize());
    expect(reloaded.getSpellSwapsUsed()).toBe(3);

    // Omitted entirely at its default, so existing spellbooks grow by nothing.
    expect(caster({ used: 0 }).serialize()).not.toHaveProperty('SpellSwapsUsed');
  });

  test('a spellbook saved before the field existed still loads', () => {
    const old = caster({ used: 4 }).serialize();
    delete old.SpellSwapsUsed;
    expect(new Spellbook().load(old).getSpellSwapsUsed()).toBe(0);
  });
});
