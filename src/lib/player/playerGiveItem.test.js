import Player from './player';

/**
 * Giving something away is not the same act as crossing it off the list.
 *
 * The "−" in the same menu is a correction — the row was wrong, or the item
 * was spent — and it leaves the equipment grid alone. A gift leaves the
 * character's hands as well as their bag, because the other player is holding
 * it now.
 */

function armed({ copies = 1 } = {}) {
  const p = new Player();
  p.setName('Test');
  p.addInventoryItem('Longsword', 'Weapon', copies, 'items/Weapon/longsword');
  p.equipItem('rh1', { name: 'Longsword', link: 'items/Weapon/longsword' });
  return p;
}

test('giving the last copy empties the hand holding it', () => {
  const p = armed();
  p.giveInventoryItem('Longsword', 'Weapon', 1, { link: 'items/Weapon/longsword' });
  expect(p.getInventory()).toHaveLength(0);
  expect(p.getEquipment().rh1).toBeUndefined();
});

test('giving one of several leaves the equipped one in hand', () => {
  const p = armed({ copies: 3 });
  p.giveInventoryItem('Longsword', 'Weapon', 2, { link: 'items/Weapon/longsword' });
  expect(p.getInventory()[0].Number).toBe(1);
  expect(p.getEquipment().rh1).toBeTruthy();
});

test('a two-handed grip loses both hands at once', () => {
  const p = new Player();
  p.addInventoryItem('Greatsword', 'Weapon', 1, 'items/Weapon/greatsword');
  const grip = { name: 'Greatsword', link: 'items/Weapon/greatsword', twoHanded: true };
  p.equipItem('lh1', grip);
  p.equipItem('rh1', grip);
  p.giveInventoryItem('Greatsword', 'Weapon', 1, { link: 'items/Weapon/greatsword' });
  expect(p.getEquipment().lh1).toBeUndefined();
  expect(p.getEquipment().rh1).toBeUndefined();
});

test('an identical-looking but differently enchanted sword keeps its slot', () => {
  const p = new Player();
  p.addInventoryItem('Longsword', 'Weapon', 1, 'items/Weapon/longsword');
  p.addInventoryItem('Longsword', 'Weapon', 1, 'items/Weapon/longsword', { bonus: 1 });
  p.equipItem('rh1', { name: 'Longsword', link: 'items/Weapon/longsword', bonus: 1 });
  /* The plain one is the one leaving. */
  p.giveInventoryItem('Longsword', 'Weapon', 1, { link: 'items/Weapon/longsword' });
  expect(p.getInventory()).toHaveLength(1);
  expect(p.getEquipment().rh1).toBeTruthy();
  expect(p.getEquipment().rh1.bonus).toBe(1);
});

test('dropping is still only dropping', () => {
  const p = armed();
  p.removeInventoryItem('Longsword', 'Weapon', 1, { link: 'items/Weapon/longsword' });
  expect(p.getInventory()).toHaveLength(0);
  expect(p.getEquipment().rh1).toBeTruthy();
});
