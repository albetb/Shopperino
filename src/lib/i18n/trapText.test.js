import { setLanguage } from './index';
import { trapName, trapTerm, trapRowLabel } from './trapText';
import { trapCR, trapPrice, craftDC } from '../trap';

/**
 * The trap page is the one tool whose breakdown rows are composed in the model,
 * so every row on screen is a sentence taken apart again on the way out.
 */

afterEach(() => setLanguage('en'));

describe('a trap name and its vocabulary', () => {
  test('a sample trap is named from the pack', () => {
    setLanguage('it');
    expect(trapName('Basic Arrow Trap')).toBe('Trappola a frecce semplice');
  });

  test('the enums answer under the id as well as the printed label', () => {
    /* The tables print "Automatic" and the cost breakdown composes with the id
       "automatic"; they are the same row and the same word. */
    setLanguage('it');
    expect(trapTerm('Automatic')).toBe('Automatico');
    expect(trapTerm('automatic')).toBe('automatico');
    expect(trapTerm('Mechanical')).toBe('Meccanica');
  });

  test('English is what the tables spell', () => {
    expect(trapName('Basic Arrow Trap')).toBe('Basic Arrow Trap');
    expect(trapTerm('Automatic')).toBe('Automatic');
  });
});

describe('a breakdown row', () => {
  test('keeps the trap’s own number and translates the words round it', () => {
    setLanguage('it');
    expect(trapRowLabel('Search DC 25')).toBe('CD Cercare 25');
    expect(trapRowLabel('Disable Device DC 20')).toBe('CD Disattivare Congegni 20');
    expect(trapRowLabel('Attack bonus +15')).toBe('Bonus di attacco +15');
    expect(trapRowLabel('Average damage 12.5 → 3'))
      .toBe('Danno medio 12.5 → 3');
  });

  test('a row that names a value out of the enum tables translates both halves', () => {
    setLanguage('it');
    expect(trapRowLabel('Reset: automatic')).toBe('Ripristino: automatico');
    expect(trapRowLabel('Trigger: proximity')).toBe('Innesco: prossimità');
  });

  test('a fixed phrase is a key of its own', () => {
    setLanguage('it');
    expect(trapRowLabel('Base cost')).toBe('Costo base');
    expect(trapRowLabel('Mechanical trap')).toBe('Trappola meccanica');
  });

  test('English passes through exactly as the model composed it', () => {
    expect(trapRowLabel('Search DC 25')).toBe('Search DC 25');
    expect(trapRowLabel('Reset: automatic')).toBe('Reset: automatic');
    expect(trapRowLabel('Base cost')).toBe('Base cost');
  });
});

describe('every row the model can emit', () => {
  /* The patterns and the composers have to stay in step, and nothing but a
     real trap proves they do: an unrecognised row falls through to `t` and
     would sit there in English without failing anything. */
  const trap = {
    name: 'Poisoned Spiked Pit Trap',
    type: 'mechanical',
    trigger: { type: 'location' },
    reset: 'manual',
    searchDC: 22,
    disableDeviceDC: 20,
    save: { type: 'Reflex', dc: 20 },
    attacks: [{ bonus: 10, mode: 'ranged', damage: '2d6' }],
    pit: { depthFt: 20, fallDamage: '2d6', spikes: true },
    poison: { name: 'greenblood oil' },
    bypass: { type: 'hidden lock' },
  };

  test('is a row the pack can answer', () => {
    setLanguage('it');
    const { cr, parts } = trapCR(trap);
    const price = trapPrice(trap, cr);
    const craft = craftDC(trap, cr);
    const labels = [
      ...parts.map((p) => p.label),
      ...(price?.lines ?? []).map((l) => l.label),
      ...(craft?.lines ?? []).map((l) => l.label),
    ];
    expect(labels.length).toBeGreaterThan(6);
    const untranslated = labels.filter((l) => trapRowLabel(l) === l);
    expect(untranslated).toEqual([]);
  });
});
