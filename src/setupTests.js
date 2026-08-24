/*
 * The creature files load as a lazy chunk in the browser (see loadFile.js), but
 * the domain models read them synchronously. Pull the chunk in before any test
 * runs so `loadFile('monsters')` answers with real data, exactly as it does in
 * the app once the preload has finished.
 */
import { preloadCreatureData } from './lib/loadFile';

beforeAll(() => preloadCreatureData());
