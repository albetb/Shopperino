/**
 * The creature files load as a lazy chunk, so `loadFile` has a state no other
 * test sees: setupTests.js preloads before every suite, and the domain models
 * assume the data is there. These tests reset the module to catch the window
 * before the chunk lands.
 */
describe('creature data loading', () => {
  beforeEach(() => jest.resetModules());

  test('answers with empty shapes before the chunk lands', () => {
    const { loadFile, isCreatureDataReady } = require('./loadFile');
    expect(isCreatureDataReady()).toBe(false);
    expect(loadFile('monsters')).toEqual({ monsters: [] });
    expect(loadFile('animals')).toEqual({ animals: [] });
    expect(loadFile('vermin')).toEqual({ vermin: [] });
  });

  test('serves the real data once preloaded', async () => {
    const { loadFile, preloadCreatureData, isCreatureDataReady } = require('./loadFile');
    await preloadCreatureData();
    expect(isCreatureDataReady()).toBe(true);
    expect(loadFile('monsters').monsters.length).toBeGreaterThan(400);
    expect(loadFile('animals').animals.length).toBeGreaterThan(50);
    expect(loadFile('vermin').vermin.length).toBeGreaterThan(20);
  });

  test('notifies subscribers when the chunk lands, and unsubscribes cleanly', async () => {
    const { preloadCreatureData, subscribeCreatureData } = require('./loadFile');
    const heard = jest.fn();
    const dropped = jest.fn();
    subscribeCreatureData(heard);
    subscribeCreatureData(dropped)();
    await preloadCreatureData();
    expect(heard).toHaveBeenCalledTimes(1);
    expect(dropped).not.toHaveBeenCalled();
  });

  test('shares one request between concurrent callers', async () => {
    const { preloadCreatureData } = require('./loadFile');
    expect(preloadCreatureData()).toBe(preloadCreatureData());
  });

  test('a sync read starts the load itself', async () => {
    const { loadFile, preloadCreatureData, isCreatureDataReady } = require('./loadFile');
    loadFile('monsters');
    await preloadCreatureData();
    expect(isCreatureDataReady()).toBe(true);
  });

  test('the eagerly-bundled files are unaffected', () => {
    const { loadFile } = require('./loadFile');
    expect(loadFile('items')).toBeTruthy();
    expect(loadFile('spells')).toBeTruthy();
    expect(loadFile('feats').length).toBeGreaterThan(0);
    expect(loadFile('nonsense')).toBeNull();
  });
});
