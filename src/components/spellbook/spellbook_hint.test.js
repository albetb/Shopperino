import { getNoSpellbookHint } from './spellbook_table';

/* A gnome carries racial spell-like abilities whatever they took as a class,
   so the spellbook page has something to show even for a fighter. The hint
   above it used to tell that fighter to "select a spellcasting class" — advice
   about a choice already made, sitting directly over the spells the page was
   in fact showing. `pending` is what separates the two cases. */
describe('the hint shown when there is no class spellbook', () => {
  test('no class chosen yet — still worth asking for one', () => {
    const { text, pending } = getNoSpellbookHint('');
    expect(pending).toBe(true);
    expect(text).toMatch(/select a spellcasting class/i);
  });

  test.each(['Paladin', 'Ranger'])('a low-level %s is told when spells arrive', (cls) => {
    const { text, pending } = getNoSpellbookHint(cls);
    expect(pending).toBe(true);
    expect(text).toMatch(/4th level/i);
  });

  test.each(['Fighter', 'Rogue', 'Barbarian', 'Monk'])('a %s is never getting one', (cls) => {
    const { text, pending } = getNoSpellbookHint(cls);
    // Not pending: the gnome branch drops the line entirely rather than
    // asking for a choice that is already made.
    expect(pending).toBe(false);
    expect(text).toBe(`A ${cls} has no spellcasting.`);
  });

  test('a caster with a spellbook has nothing to say', () => {
    expect(getNoSpellbookHint('Wizard')).toEqual({ text: '', pending: false });
  });
});
