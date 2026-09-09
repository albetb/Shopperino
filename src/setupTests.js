/* Custom DOM matchers (toBeInTheDocument &c.) for the component tests. */
import '@testing-library/jest-dom';

/*
 * The creature files load as a lazy chunk in the browser (see loadFile.js), but
 * the domain models read them synchronously. Pull the chunk in before any test
 * runs so `loadFile('monsters')` answers with real data, exactly as it does in
 * the app once the preload has finished.
 */
import { preloadCreatureData } from './lib/loadFile';

/*
 * The prose packs load the same way, one chunk per language (see i18n/prose.js).
 * A test that switches to Italian and asserts on a translated description would
 * otherwise read the English, because nothing had started the chunk. Pull it in
 * up front, exactly as the app does the moment the language is known.
 */
import { preloadProse } from './lib/i18n/prose';

beforeAll(() => Promise.all([preloadCreatureData(), preloadProse('it')]));
