/**
 * Units — one place that turns a canonical number into the words shown.
 *
 * **The factors are the game's own table convention, not arithmetic.** The
 * Italian manuals do not convert; they print round values, and the data in
 * this repo already follows them. Every factor below is checked against the
 * rule notes rather than against a calculator:
 *
 * | Factor | Where it is confirmed |
 * |---|---|
 * | 1 ft = 0.3 m (5 ft = 1.5 m) | movement.md prints `9 m (6 sq)` for a 30-ft speed |
 * | below 1 m, print cm | movement.md prints `15 cm` / `30 cm` / `75 cm` for Fine / Diminutive / Tiny |
 * | 1 inch = 2.5 cm | objects.md prints hardness `per 2.5 cm of thickness` where the SRD says *per inch* — and it falls out of the foot factor exactly, since 0.3 / 12 = 0.025 |
 * | 1 mile = 1.5 km | movement.md prints `≈ 4.5 km/h for 9 m speed` where the SRD says 3 mph; **this one does not follow from the foot factor** (5,280 ft × 0.3 is 1,584 m) and has to be its own lookup |
 * | 1 lb = 0.5 kg | items.json already holds the halved values: bedroll 5 lb → 2.5 kg, backpack 2 lb → 1 |
 *
 * The true conversions (0.3048, 1.609, 0.4536) are all *wrong here*: they put
 * the app out of step with the book on the table.
 *
 * **The canonical units are feet and kilograms**, and the model keeps them —
 * nothing below is ever called from `src/lib/player` or the other domain
 * models. Every rule constant in 3.5 is stated in feet (a 5-ft step, a 30-ft
 * range increment, a 60-ft cone), so feet is what the rules arithmetic is done
 * in; weight was already metric everywhere. Conversion happens here, at the
 * edge, once per thing displayed.
 */

export const UNIT_MODES = ['metric', 'imperial', 'squares'];
export const DEFAULT_UNITS = 'metric';

export const UNIT_MODE_LABELS = {
  metric: 'Metric',
  imperial: 'Imperial',
  squares: 'Squares',
};

export const UNIT_MODE_HINTS = {
  metric: 'Metres and kilograms, on the manual’s own round values.',
  imperial: 'Feet and pounds, as the English books print them.',
  squares: 'Distance counted in 5-ft squares, for running a grid. Weight stays metric.',
};

const M_PER_FT = 0.3;
const KM_PER_MILE = 1.5;
const KG_PER_LB = 0.5;
const FT_PER_SQUARE = 5;

export function normalizeUnits(value) {
  return UNIT_MODES.includes(value) ? value : DEFAULT_UNITS;
}

/**
 * Drop the decimals a round value does not need.
 *
 * 9 rather than 9.0, but 1.5 keeps its half — a 5-ft step is 1.5 m and always
 * prints that way.
 */
function trim(n) {
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(Number(rounded.toFixed(2)));
}

/**
 * A distance held in feet, in the words for this mode.
 *
 * Metric drops to centimetres below a metre, because that is what the notes
 * do: a Fine creature's space is 15 cm, not 0.15 m.
 */
export function formatDistance(feet, units = DEFAULT_UNITS, { abbrev = true } = {}) {
  const ft = Number(feet) || 0;
  const mode = normalizeUnits(units);
  if (mode === 'imperial') {
    /* Under a foot the book says inches, not a fraction of a foot: a Fine
       creature's space is 6 inches rather than 0.5 ft. */
    if (ft !== 0 && Math.abs(ft) < 1) {
      const inches = ft * 12;
      return `${trim(inches)} ${Math.abs(inches) === 1 ? 'inch' : 'inches'}`;
    }
    return `${trim(ft)} ${abbrev ? 'ft' : 'feet'}`;
  }
  if (mode === 'squares') {
    const sq = ft / FT_PER_SQUARE;
    return `${trim(sq)} ${abbrev ? 'sq' : (Math.abs(sq) === 1 ? 'square' : 'squares')}`;
  }
  const m = ft * M_PER_FT;
  if (m !== 0 && Math.abs(m) < 1) return `${trim(m * 100)} cm`;
  return `${trim(m)} m`;
}

/** A weight held in kilograms, in the words for this mode. */
export function formatWeight(kg, units = DEFAULT_UNITS) {
  const value = Number(kg) || 0;
  if (normalizeUnits(units) === 'imperial') return `${trim(value / KG_PER_LB)} lb`;
  return `${trim(value)} kg`;
}

/* --- the prose converter -------------------------------------------------
 *
 * 6,135 measurements sit in the descriptions the app renders, and a speed that
 * says 9 m beside a spell that says "within 30 ft." is worse than not
 * switching at all. So the descriptions are converted at render time rather
 * than copied into a second set of data files: one source of truth, every
 * `Link` / `ref` slug untouched, and the switch is instant rather than a
 * rebuild.
 */

/* A leading number is required, and that is what excludes the false positives
   by construction: "on foot", "the foot of the stairs", "at his feet" are
   never preceded by a digit. */
const NUMBER = '\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?(?:/\\d+)?';

/* Every shape measured in src/data, imperial and metric both. Longest first:
   `feet` has to be tried before `foot`, `lbs.` before `lb`, or the shorter
   alternative wins and leaves a stray letter behind. */
const UNIT_WORDS = [
  'feet', 'foot', 'ft\\.', 'ft',
  'inches', 'inch', 'in\\.',
  'miles', 'mile',
  'pounds', 'pound', 'lbs\\.', 'lbs', 'lb\\.', 'lb',
  'kg', 'km', 'cm', 'm',
];

const MEASURE = new RegExp(
  `(${NUMBER})(\\s*|-)(${UNIT_WORDS.join('|')})(?![A-Za-z])`,
  'gi',
);

/**
 * What one matched unit word means: which system it is already in, what it
 * measures, and its value in canonical terms.
 *
 * The *system* matters as much as the value. Text already in the target system
 * is returned untouched rather than round-tripped through a conversion — so
 * "30 ft." stays "30 ft." for an imperial reader instead of quietly losing its
 * full stop, and running the converter twice changes nothing the second time.
 */
function canonical(amount, word) {
  const w = word.toLowerCase();
  if (w === 'feet' || w === 'foot' || w === 'ft.' || w === 'ft') return { system: 'imperial', kind: 'd', ft: amount };
  if (w === 'inches' || w === 'inch' || w === 'in.') return { system: 'imperial', kind: 'd', ft: amount / 12 };
  if (w === 'miles' || w === 'mile') return { system: 'imperial', kind: 'far', km: amount * KM_PER_MILE };
  if (w === 'pounds' || w === 'pound' || w.startsWith('lb')) return { system: 'imperial', kind: 'w', kg: amount * KG_PER_LB };
  if (w === 'kg') return { system: 'metric', kind: 'w', kg: amount };
  if (w === 'km') return { system: 'metric', kind: 'far', km: amount };
  if (w === 'cm') return { system: 'metric', kind: 'd', ft: amount / 100 / M_PER_FT };
  if (w === 'm') return { system: 'metric', kind: 'd', ft: amount / M_PER_FT };
  return null;
}

function parseAmount(raw) {
  const text = String(raw);
  if (text.includes('/')) {
    const [a, b] = text.split('/');
    const n = Number(a);
    const d = Number(b);
    if (Number.isFinite(n) && Number.isFinite(d) && d !== 0) return n / d;
  }
  /* A comma here is a thousands separator, never a decimal point: the data
     says "6,500 pounds" for a giant's carrying capacity. Reading it as 6.5
     would have turned three and a quarter tonnes into three kilograms. */
  const n = Number(text.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Put the thousands separators back, so 3,250 kg does not read as 3250 kg. */
function group(text) {
  const [whole, frac] = text.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac ? `${grouped}.${frac}` : grouped;
}

/**
 * A long distance in the target mode, keeping miles and kilometres as miles
 * and kilometres — nobody wants a familiar's empathic link quoted in metres.
 */
function longDistance(km, mode) {
  if (mode === 'imperial') return `${group(trim(km / KM_PER_MILE))} ${trim(km / KM_PER_MILE) === '1' ? 'mile' : 'miles'}`;
  return `${group(trim(km))} km`;
}

/**
 * Convert every measurement in a run of text.
 *
 * Deliberately *not* converted:
 *
 * - **Area and volume.** "10 cubic feet" and "5 square feet" convert on a
 *   different factor entirely — a square foot is not 0.3 square metres — and
 *   the leading-number rule skips them for free, because a word sits between
 *   the number and the unit. There are 36 of them and they are left alone on
 *   purpose, with a test that says so.
 * - **Anything inside a tag.** The descriptions are HTML, and an attribute
 *   value that happened to look like a measurement would otherwise be rewritten
 *   into a broken link.
 */
export function convertUnitsInText(text, units = DEFAULT_UNITS) {
  if (typeof text !== 'string' || !text) return text;
  const mode = normalizeUnits(units);
  /* Squares is a way of counting distance, not a system of weight — the notes
     print "9 m (6 sq)" and never a weight in squares — so it reads weights the
     metric way. */
  const weightSystem = mode === 'imperial' ? 'imperial' : 'metric';

  return text.replace(MEASURE, (whole, num, sep, word) => {
    const amount = parseAmount(num);
    if (amount == null) return whole;
    const c = canonical(amount, word);
    if (!c) return whole;

    const joiner = sep === '-' ? '-' : ' ';
    const join = (out) => (joiner === '-' ? out.replace(' ', '-') : out);

    if (c.kind === 'w') {
      if (c.system === weightSystem) return whole;
      return join(weightSystem === 'imperial'
        ? `${group(trim(c.kg / KG_PER_LB))} lb`
        : `${group(trim(c.kg))} kg`);
    }

    /* Miles and kilometres stay long units. Nobody wants a familiar's empathic
       link quoted in metres, and nothing wants it in squares. */
    if (c.kind === 'far') {
      if (c.system === weightSystem) return whole;
      return join(longDistance(c.km, mode));
    }

    if (mode !== 'squares' && c.system === mode) return whole;

    const [value, unit] = formatDistance(c.ft, mode).split(' ');
    return `${group(value)}${joiner}${unit}`;
  });
}

/**
 * The same, over a string of HTML, leaving every tag alone.
 *
 * Splitting on `<...>` rather than parsing: the descriptions are small, this
 * runs at render time, and the only thing that has to be protected is the
 * inside of a tag.
 */
export function convertUnitsInHtml(html, units = DEFAULT_UNITS) {
  if (typeof html !== 'string' || !html) return html;
  return html
    .split(/(<[^>]*>)/g)
    .map((chunk) => (chunk.startsWith('<') ? chunk : convertUnitsInText(chunk, units)))
    .join('');
}
