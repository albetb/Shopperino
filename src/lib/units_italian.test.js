import { convertUnitsInText } from './units';

/* The app's prose is Italian, and the unit switch reads that prose. A
   translator writing "entro 9 metri" instead of "entro 30 feet" is writing
   correct Italian; before units.js knew the Italian words, that sentence
   simply stopped converting — silently, with nothing on screen to show for it.
   These tests are what keeps the two languages in step. */

describe('Italian unit words convert like the English ones', () => {
  test('a distance written in piedi reaches the metric reader in metres', () => {
    expect(convertUnitsInText('entro 30 piedi', 'metric')).toBe('entro 9 m');
    expect(convertUnitsInText('un passo di 5 piedi', 'metric')).toBe('un passo di 1.5 m');
  });

  test('a distance written in metri reaches the imperial reader in feet', () => {
    expect(convertUnitsInText('entro 9 metri', 'imperial')).toBe('entro 30 ft');
  });

  test('libbre convert on the same halving the English pounds use', () => {
    expect(convertUnitsInText('5 libbre', 'metric')).toBe('2.5 kg');
    expect(convertUnitsInText('1 libbra', 'metric')).toBe('0.5 kg');
  });

  test('miglia stay long units rather than becoming metres', () => {
    expect(convertUnitsInText('1 miglio', 'metric')).toBe('1.5 km');
    expect(convertUnitsInText('2 miglia', 'metric')).toBe('3 km');
  });

  test('pollici convert like inches', () => {
    expect(convertUnitsInText('6 pollici', 'metric')).toBe('15 cm');
  });
});

describe('text already in the reader\'s system is left alone', () => {
  test('Italian metric text is untouched for a metric reader', () => {
    // Idempotent: the words the translator chose survive, punctuation and all.
    const it = 'La creatura si muove di 9 metri e pesa 4 chilogrammi.';
    expect(convertUnitsInText(it, 'metric')).toBe(it);
  });

  test('running the converter twice changes nothing the second time', () => {
    const once = convertUnitsInText('entro 30 piedi', 'metric');
    expect(convertUnitsInText(once, 'metric')).toBe(once);
  });
});

describe('squares still count distance in squares', () => {
  test('piedi become squares', () => {
    expect(convertUnitsInText('entro 30 piedi', 'squares')).toBe('entro 6 sq');
  });
});
