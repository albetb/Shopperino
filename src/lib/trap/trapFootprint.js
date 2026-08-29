/**
 * The board diagram, as data.
 *
 * Every sample trap carries a derived `footprint` — `single`, `squares`,
 * `area`, `room`, `burst`, `multi`, with a square count. This turns one into a
 * grid of 5-ft squares the page can draw, and answers the question the
 * footprint alone cannot: **where the trigger is**.
 *
 * That answer is derived from the trigger *type*, because nothing in the data
 * records a position. A location trigger is the trapped square itself — you
 * set it off by standing in it. A proximity trigger reaches a square further
 * out, so it is drawn as a ring, and it is the one that catches a flyer. A
 * touch trigger is the object, one square. Sound, visual and timed triggers
 * have no square at all: they are watching or counting, and drawing a square
 * for them would be inventing one.
 */

/** Where the trigger sits, relative to the squares the trap catches. */
export const TRIGGER_SHAPE = {
  location: 'inside',
  spell: 'inside',
  touch: 'centre',
  proximity: 'ring',
  timed: 'none',
  sound: 'none',
  visual: 'none',
};

/** What each trigger shape means, for the legend under the grid. */
export const TRIGGER_SHAPE_NOTE = {
  inside: 'Springs when a creature enters a trapped square.',
  centre: 'Springs when the object is touched.',
  ring: 'Springs when a creature comes within range — a flyer included.',
  none: 'Nothing on the floor sets this off — it watches, listens, or counts.',
};

const CELL_FT = 5;

/** The block of squares a footprint covers, as {w, h} in squares. */
function footprintBlock(footprint) {
  const kind = footprint?.kind || 'single';
  const squares = Math.max(1, Number(footprint?.squares) || 1);
  if (kind === 'area' || kind === 'room') {
    const w = Math.max(1, Math.round((Number(footprint.widthFt) || CELL_FT) / CELL_FT));
    const h = Math.max(1, Math.round((Number(footprint.lengthFt) || CELL_FT) / CELL_FT));
    return { w, h };
  }
  if (kind === 'burst') {
    /* A burst is centred on a grid intersection, so a 5-ft radius covers the
       four squares around it rather than a 3-wide cross. The square count the
       footprint carries already says so; this keeps the two in step. */
    const side = Math.max(1, Math.round(Math.sqrt(squares)));
    return { w: side, h: side };
  }
  // single, squares, multi — a row, which is how "two adjacent squares" reads.
  return { w: squares, h: 1 };
}

/**
 * Build the grid for one trap.
 *
 * @returns {{
 *   cols: number, rows: number, cellFt: number,
 *   cells: Array<{x: number, y: number, effect: boolean, trigger: boolean, wall: boolean}>,
 *   kind: string, triggerShape: string, triggerType: string,
 *   effectSquares: number, caption: string
 * }}
 */
export function trapGrid(trap) {
  const footprint = trap?.footprint || { kind: 'single', squares: 1 };
  const kind = footprint.kind || 'single';
  const { w, h } = footprintBlock(footprint);
  const triggerType = trap?.trigger?.type || '';
  const shape = TRIGGER_SHAPE[triggerType] ?? 'inside';

  /* One square of margin all round, and two when a proximity ring needs
     somewhere to sit. */
  const margin = shape === 'ring' ? 2 : 1;
  const cols = w + margin * 2;
  const rows = h + margin * 2;
  const left = margin;
  const top = margin;

  const inEffect = (x, y) => x >= left && x < left + w && y >= top && y < top + h;
  const centreX = left + Math.floor((w - 1) / 2);
  const centreY = top + Math.floor((h - 1) / 2);

  const cells = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const effect = inEffect(x, y);
      let trigger = false;
      if (shape === 'inside') trigger = effect;
      else if (shape === 'centre') trigger = x === centreX && y === centreY;
      else if (shape === 'ring') {
        const touchesEffect = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
          .some(([dx, dy]) => inEffect(x + dx, y + dy));
        trigger = !effect && touchesEffect;
      }
      /* A room's walls are the reason it is a room and not an area: the
         victims are shut in with the water or the closing ceiling. */
      const wall = kind === 'room'
        && !effect
        && (x >= left - 1 && x <= left + w && y >= top - 1 && y <= top + h);
      cells.push({ x, y, effect, trigger, wall });
    }
  }

  return {
    cols,
    rows,
    cellFt: CELL_FT,
    cells,
    kind,
    triggerShape: shape,
    triggerType,
    effectSquares: w * h,
    caption: captionFor(kind, footprint, w, h),
  };
}

function captionFor(kind, footprint, w, h) {
  const ft = (n) => `${n * CELL_FT} ft.`;
  switch (kind) {
    case 'single':
      return 'One 5-ft. square.';
    case 'squares':
      return `${w} adjacent squares — one target in each.`;
    case 'multi':
      return `${w} specified squares, struck together.`;
    case 'area':
      return `An area ${ft(w)} by ${ft(h)}`;
    case 'room':
      return `A room ${ft(w)} by ${ft(h)} — everything inside is caught.`;
    case 'burst':
      return `A ${footprint.radiusFt ?? 5}-ft. radius burst.`;
    default:
      return '';
  }
}

/**
 * Whether the footprint is one the diagram is confident about.
 *
 * The footprints were **inferred** from the book's multiple-target prose
 * rather than authored, so a specific trap may want hand-tuning. Where the
 * trap also carries a free-text `note` or a `multipleTraps` line, the diagram
 * is definitely not the whole story and the page says so instead of pretending.
 */
export function footprintCaveat(trap) {
  if (trap?.multipleTraps) {
    return 'This entry is really more than one trap sharing a trigger — the diagram draws one of them.';
  }
  if (trap?.note) {
    return 'This trap carries a note the diagram cannot draw. Read it below.';
  }
  return '';
}
