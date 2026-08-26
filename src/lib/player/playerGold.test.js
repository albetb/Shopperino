import Player from './player';

function withGold(gp) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(1);
  p.setGold(gp);
  return p;
}

describe('money as one gold figure', () => {
  test('the decimals are the silver and copper', () => {
    // 12.34 gp is 12 gold, 3 silver, 4 copper — two decimals is exactly
    // copper precision.
    expect(withGold(12.34).getGold()).toBe(12.34);
    expect(withGold(0.05).getGold()).toBe(0.05);
  });

  test('a third decimal is a coin that does not exist, so it rounds away', () => {
    expect(withGold(1.006).getGold()).toBe(1.01);
    expect(withGold(1.004).getGold()).toBe(1);
    /* Exactly-half cases go by toFixed, which rounds the binary value rather
       than the decimal one: 1.005 is really 1.00499…, so it rounds down. Worth
       pinning — it is the one place the displayed figure can differ from what
       a pocket calculator would say, and it is off by a single copper. */
    expect(withGold(1.005).getGold()).toBe(1);
  });

  test('earning and spending keep two decimals without float drift', () => {
    const p = withGold(1.1);
    p.adjustGold(2.2);
    expect(p.getGold()).toBe(3.3); // not 3.3000000000000003

    p.adjustGold(-0.1);
    expect(p.getGold()).toBe(3.2);
  });

  test('spending more than is carried empties the purse rather than going negative', () => {
    const p = withGold(5);
    p.adjustGold(-8);
    expect(p.getGold()).toBe(0);
  });

  test('a nonsense value reads as nothing rather than NaN', () => {
    expect(withGold('not a number').getGold()).toBe(0);
    expect(withGold(-3).getGold()).toBe(0);
  });

  test('repeated small spends stay exact', () => {
    // Ten copper spends should take exactly one silver, not 0.09999999.
    const p = withGold(1);
    for (let i = 0; i < 10; i += 1) p.adjustGold(-0.01);
    expect(p.getGold()).toBe(0.9);
  });
});
