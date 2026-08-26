import Player from './player';

function make() {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(1);
  return p;
}

/** Put an item in the bag and wear it in one of the four free slots. */
function carryAndEquip(p, slot, { name, type = 'Wondrous Item', number = 1, link = '', ...opts }) {
  p.addInventoryItem(name, type, number, link, opts);
  p.equipItem(slot, { name, link, ...opts });
}

describe('the four free equipment slots', () => {
  test('nothing equipped reports nothing', () => {
    expect(make().getEquippedAccessories()).toEqual([]);
  });

  test('hands and armor are not free slots', () => {
    const p = make();
    carryAndEquip(p, 'rh1', { name: 'Longsword', type: 'Weapon', link: 'items/Weapon/longsword' });
    carryAndEquip(p, 'armor', { name: 'Chain shirt', type: 'Armor' });
    expect(p.getEquippedAccessories()).toEqual([]);
  });

  test('the slots are listed in their own order, not the order they were filled', () => {
    const p = make();
    carryAndEquip(p, 'other3', { name: 'Wand of magic missile' });
    carryAndEquip(p, 'other1', { name: 'Cloak of resistance' });
    carryAndEquip(p, 'other4', { name: 'Bag of holding' });
    expect(p.getEquippedAccessories().map((i) => i.slot)).toEqual(['other1', 'other3', 'other4']);
  });

  test('the count comes from the matching inventory row', () => {
    const p = make();
    carryAndEquip(p, 'other1', { name: 'Potion of cure light wounds', type: 'Potion', number: 5 });
    const [potion] = p.getEquippedAccessories();
    expect(potion.number).toBe(5);
    expect(potion.name).toBe('Potion of cure light wounds');
  });

  test('two otherwise identical items are told apart by their enhancement bonus', () => {
    const p = make();
    // Three plain rings in the bag, one +2 ring worn — the worn one is not
    // three of them just because the names match.
    p.addInventoryItem('Ring of protection', 'Ring', 3, 'items/Ring/ring-of-protection');
    carryAndEquip(p, 'other1', {
      name: 'Ring of protection', type: 'Ring', number: 1,
      link: 'items/Ring/ring-of-protection', bonus: 2,
    });
    const [ring] = p.getEquippedAccessories();
    expect(ring.number).toBe(1);
    expect(ring.bonus).toBe(2);
  });

  test('an item worn but no longer in the bag still counts as one', () => {
    const p = make();
    p.equipItem('other2', { name: 'Figurine of wondrous power', link: '' });
    const [figurine] = p.getEquippedAccessories();
    expect(figurine.number).toBe(1);
    expect(figurine.link).toBe('');
  });

  test('a renamed item reports the name the sheet shows', () => {
    const p = make();
    p.equipItem('other1', { name: 'Amulet', overrides: { Name: 'Amulet of the Drowned King' } });
    expect(p.getEquippedAccessories()[0].name).toBe('Amulet of the Drowned King');
  });

  test('an empty slot entry is not an item', () => {
    const p = make();
    p.equipItem('other1', { name: '', link: '' });
    expect(p.getEquippedAccessories()).toEqual([]);
  });
});
