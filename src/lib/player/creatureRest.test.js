import Player from './player';
import AnimalCompanion from './animalCompanion';
import { getSelectableCompanions } from '../animal/animalCompanionData';

/* A bonded creature rests with its master. The rule is the character one from
   combat.md — 1 hit point per night — counted in the creature's Hit Dice
   rather than in class levels, because a creature has no levels.

   The companion is the case the sheet was getting wrong: resting healed the
   druid and left the animal bleeding, which is not what "long rest" means at
   any table. */

function druid(level = 9) {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Druid';
  p.level = level;
  p.race = 'Human';
  p.maxLife = 60;
  return p;
}

/**
 * A druid with the first companion the level offers, attached the way the
 * thunk attaches one. Asserts it exists rather than skipping if it does not —
 * a guard here would let the whole file pass while testing nothing.
 */
function druidWithCompanion(level = 9) {
  const p = druid(level);
  const options = getSelectableCompanions(level);
  expect(options.length).toBeGreaterThan(0);
  const companion = new AnimalCompanion({ class: p.getClass(), level: p.getLevel() });
  companion.setRef(options[0].ref);
  p.companion = companion;
  expect(companion.getTotalHD()).toBeGreaterThan(0);
  return p;
}

describe('a companion heals a hit point per Hit Die', () => {
  test('the amount is capped by the damage actually taken', () => {
    const c = druidWithCompanion().companion;
    c.setDamage(2);
    expect(c.getRestHealAmount()).toBe(2);
  });

  test('and by the Hit Dice when the damage is deeper than a night can mend', () => {
    const c = druidWithCompanion().companion;
    c.setDamage(999);
    expect(c.getRestHealAmount()).toBe(c.getTotalHD());
  });

  test('resting applies exactly that and never overshoots into negative damage', () => {
    const c = druidWithCompanion().companion;
    c.setDamage(1);
    c.healAsIfRested();
    expect(c.getDamage()).toBe(0);
    c.healAsIfRested();
    expect(c.getDamage()).toBe(0);
  });

  test('a deep wound heals over several nights rather than all at once', () => {
    const c = druidWithCompanion().companion;
    const hd = c.getTotalHD();
    c.setDamage(hd * 2);
    c.healAsIfRested();
    expect(c.getDamage()).toBe(hd);
    c.healAsIfRested();
    expect(c.getDamage()).toBe(0);
  });
});

describe('a paladin mount', () => {
  function mountedPaladin(level = 8) {
    const p = new Player();
    p.name = 'Test';
    p.class = 'Paladin';
    p.level = level;
    p.race = 'Human';
    p.maxLife = 60;
    const mount = p.addSpecialMount();
    expect(mount).toBeTruthy();
    expect(mount.getTotalHD()).toBeGreaterThan(0);
    return p;
  }

  test('heals by its own Hit Dice too', () => {
    const mount = mountedPaladin().specialMount;
    mount.setDamage(999);
    expect(mount.getRestHealAmount()).toBe(mount.getTotalHD());
  });
});

describe('whether a rest is worth taking', () => {
  test('a wounded companion is reason enough on its own', () => {
    const p = druidWithCompanion();
    expect(p.needsRest()).toBe(false);
    p.companion.setDamage(3);
    expect(p.needsRest()).toBe(true);
  });

  test('and resting clears it', () => {
    const p = druidWithCompanion();
    p.companion.setDamage(1);
    [p.companion, p.specialMount, p.familiar].forEach((c) => c?.healAsIfRested?.());
    expect(p.needsRest()).toBe(false);
  });
});
