import { getTraps, getTrapByRef } from './trapData';
import { trapGrid, footprintCaveat, TRIGGER_SHAPE } from './trapFootprint';
import { rollTrap, diceForAverage, spellAtLevel } from './trapGenerator';
import { trapCR } from './trapCR';

/* The board diagram, and the roll that feeds it.
 *
 * The footprint says which squares the trap catches. It does not say where the
 * trigger is — nothing in the data does — so that is derived from the trigger
 * type, and the derivation is the part most worth pinning down.
 */

const cellsWhere = (grid, fn) => grid.cells.filter(fn);

describe('the squares the trap catches', () => {
  test('a single-square trap is one square, with room around it', () => {
    const grid = trapGrid(getTrapByRef('traps/cr1/basic-arrow-trap'));
    expect(cellsWhere(grid, (c) => c.effect)).toHaveLength(1);
    expect(grid.cols).toBeGreaterThan(1);
    expect(grid.rows).toBeGreaterThan(1);
  });

  test('two adjacent squares are drawn side by side', () => {
    const grid = trapGrid(getTrapByRef('traps/cr1/deeper-pit-trap'));
    const effect = cellsWhere(grid, (c) => c.effect);
    expect(effect).toHaveLength(2);
    expect(effect[0].y).toBe(effect[1].y);
    expect(Math.abs(effect[0].x - effect[1].x)).toBe(1);
  });

  test('a 10-by-10 area is four squares', () => {
    const grid = trapGrid(getTrapByRef('traps/cr4/poisoned-dart-trap'));
    expect(cellsWhere(grid, (c) => c.effect)).toHaveLength(4);
    expect(grid.caption).toBe('An area 10 ft. by 10 ft.');
  });

  test('a room is drawn with walls, because being shut in is the point', () => {
    const grid = trapGrid(getTrapByRef('traps/cr4/water-filled-room-trap'));
    expect(cellsWhere(grid, (c) => c.effect)).toHaveLength(4);
    expect(cellsWhere(grid, (c) => c.wall).length).toBeGreaterThan(0);
    expect(grid.caption).toMatch(/everything inside is caught/);
  });

  test('a 5-ft. burst covers the four squares around its centre', () => {
    // It is centred on a grid intersection, not on a square.
    const grid = trapGrid(getTrapByRef('traps/cr2/box-of-brown-mold'));
    expect(cellsWhere(grid, (c) => c.effect)).toHaveLength(4);
    expect(grid.caption).toBe('A 5-ft. radius burst.');
  });

  test('every sample produces a grid whose cells fill it exactly', () => {
    getTraps().forEach((t) => {
      const grid = trapGrid(t);
      expect(grid.cells).toHaveLength(grid.cols * grid.rows);
      expect(cellsWhere(grid, (c) => c.effect).length).toBeGreaterThan(0);
    });
  });
});

describe('where the trigger goes', () => {
  test('a location trigger is the trapped square itself', () => {
    const grid = trapGrid(getTrapByRef('traps/cr1/deeper-pit-trap'));
    expect(grid.triggerShape).toBe('inside');
    grid.cells.forEach((c) => expect(c.trigger).toBe(c.effect));
  });

  test('a proximity trigger is a ring outside it — which is what catches a flyer', () => {
    const grid = trapGrid(getTrapByRef('traps/cr1/basic-arrow-trap'));
    expect(grid.triggerShape).toBe('ring');
    const ring = cellsWhere(grid, (c) => c.trigger);
    expect(ring).toHaveLength(8);
    ring.forEach((c) => expect(c.effect).toBe(false));
  });

  test('a touch trigger is the object, one square', () => {
    const grid = trapGrid(getTrapByRef('traps/cr2/box-of-brown-mold'));
    expect(grid.triggerShape).toBe('centre');
    expect(cellsWhere(grid, (c) => c.trigger)).toHaveLength(1);
  });

  test('a trigger that watches or counts gets no square at all', () => {
    /* Sound, visual and timed triggers have no position, and drawing one for
       them would be inventing it. */
    ['timed', 'sound', 'visual'].forEach((type) => {
      expect(TRIGGER_SHAPE[type]).toBe('none');
    });
    const watching = trapGrid(getTrapByRef('traps/cr10/energy-drain-trap'));
    expect(watching.triggerType).toBe('visual');
    expect(cellsWhere(watching, (c) => c.trigger)).toHaveLength(0);
  });
});

describe('when the diagram is not the whole story', () => {
  test('a multi-trap entry says the diagram draws one of them', () => {
    expect(footprintCaveat(getTrapByRef('traps/cr8/acid-arrow-trap')))
      .toMatch(/really more than one trap/);
  });

  test('a trap with a note points at it', () => {
    expect(footprintCaveat(getTrapByRef('traps/cr2/large-net-trap')))
      .toMatch(/carries a note/);
  });

  test('an ordinary trap says nothing', () => {
    expect(footprintCaveat(getTrapByRef('traps/cr1/basic-arrow-trap'))).toBe('');
  });
});

describe('rolling a trap', () => {
  test('dice are chosen to average what was asked for', () => {
    expect(diceForAverage(21)).toBe('6d6');
    expect(diceForAverage(7)).toBe('2d6');
  });

  test('a real spell of the right level is picked for a magic trap', () => {
    const spell = spellAtLevel(3, 'Sor/Wiz');
    expect(spell).toBeTruthy();
    expect(spell.Level).toMatch(/Sor\/Wiz 3/);
  });

  test('a rolled trap lands on the CR it was asked for', () => {
    /* By construction, not by rejection: the features are chosen first and
       whatever CR is left over is spent on damage. */
    for (let cr = 1; cr <= 10; cr += 1) {
      for (let i = 0; i < 12; i += 1) {
        const trap = rollTrap({ targetCR: cr });
        expect(trapCR(trap).cr).toBe(cr);
        expect(trap.cr).toBe(cr);
      }
    }
  });

  test('the type can be asked for', () => {
    ['mechanical', 'magic device', 'spell'].forEach((type) => {
      expect(rollTrap({ targetCR: 5, type }).type).toBe(type);
    });
  });

  test('it comes out in the same shape as a sample, so everything reads it', () => {
    const trap = rollTrap({ targetCR: 6, type: 'mechanical' });
    expect(trap.trigger.type).toBeTruthy();
    expect(trap.reset).toBeTruthy();
    expect(trap.footprint.kind).toBeTruthy();
    expect(Number.isFinite(trap.searchDC)).toBe(true);
    expect(trapGrid(trap).cells.length).toBeGreaterThan(0);
  });

  test('a spell trap never resets — the rules allow no other answer', () => {
    for (let i = 0; i < 10; i += 1) {
      expect(rollTrap({ targetCR: 4, type: 'spell' }).reset).toBe('no');
    }
  });

  test('a mechanical trap never uses a trigger only magic can have', () => {
    for (let i = 0; i < 40; i += 1) {
      const trap = rollTrap({ targetCR: 5, type: 'mechanical' });
      expect(['sound', 'visual', 'spell']).not.toContain(trap.trigger.type);
    }
  });
});
