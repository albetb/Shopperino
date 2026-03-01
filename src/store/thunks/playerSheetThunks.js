import Player from '../../lib/player';
import Spellbook from '../../lib/spellbook';
import * as db from '../../lib/storage';
import { cap } from '../../lib/utils';
import { getDefaultAlignmentForClass, druidMoralToEthical, druidEthicalToMoral } from '../../lib/alignment';
import { playerToSpellbookData } from '../../lib/player/playerSpellbookAdapter';
import {
  setCharactersList,
  setSelectedCharacterIndex,
  setPlayer,
} from '../slices/playerSheetSlice';
import { setPersist } from '../slices/persistSlice';

function hydratePlayerSheet(dispatch, app) {
  dispatch(setCharactersList(db.getPlayerSheetCharactersList(app)));
  const idx = app.pss != null && app.pss >= 0 && app.psc?.[app.pss] ? app.pss : null;
  dispatch(setSelectedCharacterIndex(idx));
  if (idx != null) {
    const p = db.getPlayerByIndex(app, idx);
    dispatch(setPlayer(p));
  } else {
    dispatch(setPlayer(null));
  }
}

function persistPlayer(dispatch, getState, playerInstance) {
  const app = getState().persist;
  const idx = app.pss;
  if (idx == null || idx < 0 || !app.psc?.[idx]) return;
  const serialized = playerInstance.serialize();
  const newApp = db.updatePlayerAt(app, idx, serialized);
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  // Dispatch a fresh player instance so Redux state reference changes and UI (e.g. spellbook) re-renders
  const freshPlayer = db.getPlayerByIndex(newApp, idx);
  dispatch(setPlayer(freshPlayer));
}

function withPlayerSpellbook(getState, fn) {
  const player = getState().playerSheet?.player;
  if (!player) return;
  const data = playerToSpellbookData(player);
  if (!data) return;
  const s = new Spellbook().load(data);
  fn(s);
  player.spells = s.Spells.slice();
  player.usedDomainSpells = s.UsedDomainSpells.slice();
  player.preparedDomainSpells = { ...s.PreparedDomainSpells };
  Object.keys(player.preparedDomainSpells).forEach((k) => {
    const arr = s.PreparedDomainSpells[k];
    player.preparedDomainSpells[k] = Array.isArray(arr) ? arr.slice() : [];
  });
}

export const onCreateCharacter = (nameRaw) => (dispatch, getState) => {
  const name = cap(nameRaw);
  if (!name.trim()) return;
  const app = getState().persist;
  const list = db.getPlayerSheetCharactersList(app);
  const existingIndex = list.findIndex((c) => (c.name ?? '').trim() === name.trim());
  if (existingIndex >= 0) {
    const newApp = { ...app, pss: existingIndex };
    db.saveApp(newApp);
    dispatch(setPersist(newApp));
    hydratePlayerSheet(dispatch, newApp);
    return;
  }
  const p = new Player();
  p.setName(name);
  const psc = [...(app.psc || []), p.serialize()];
  const newApp = { ...app, psc, pss: psc.length - 1 };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  hydratePlayerSheet(dispatch, newApp);
};

export const onSelectCharacter = (name) => (dispatch, getState) => {
  const app = getState().persist;
  const list = db.getPlayerSheetCharactersList(app);
  const idx = list.findIndex((c) => (c.name ?? '') === name);
  if (idx < 0) return;
  const newApp = { ...app, pss: idx };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  hydratePlayerSheet(dispatch, newApp);
};

export const onDeleteCharacter = () => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.length) return;
  const psc = app.psc.filter((_, i) => i !== app.pss);
  const newPss = psc.length === 0 ? null : Math.min(app.pss, psc.length - 1);
  const newApp = { ...app, psc, pss: newPss };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  hydratePlayerSheet(dispatch, newApp);
};

export const onUpdateCharacter = (payload) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  if (typeof payload === 'object' && payload !== null) {
    if (payload.name !== undefined) p.setName(payload.name);
    if (payload.race !== undefined) p.setRace(payload.race);
    if (payload.class !== undefined) p.setClass(payload.class);
    if (payload.level !== undefined) p.setLevel(payload.level);
    if (payload.abilities && typeof payload.abilities === 'object') {
      const keys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
      keys.forEach((key) => {
        if (payload.abilities[key]) {
          if (payload.abilities[key].base !== undefined) p.setAbilityBase(key, payload.abilities[key].base);
          if (payload.abilities[key].bonus !== undefined) p.setAbilityBonus(key, payload.abilities[key].bonus);
        }
      });
    }
  }
  persistPlayer(dispatch, getState, p);
};

export const onSetCharacterRace = (race) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.setRace(race);
  persistPlayer(dispatch, getState, p);
};

export const onSetCharacterClass = (_class) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.setClass(_class);
  const { moral, ethical } = getDefaultAlignmentForClass(_class);
  p.moralAlignment = moral;
  p.ethicalAlignment = ethical;
  persistPlayer(dispatch, getState, p);
};

export const onSetCharacterLevel = (level) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.setLevel(level);
  persistPlayer(dispatch, getState, p);
};

export const onSetAbilityBase = (abilityKey, value) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.setAbilityBase(abilityKey, value);
  persistPlayer(dispatch, getState, p);
};

export const onSetAbilityBonus = (abilityKey, value) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.setAbilityBonus(abilityKey, value);
  persistPlayer(dispatch, getState, p);
};

export const onCreateNote = (nameRaw) => (dispatch, getState) => {
  const name = cap(nameRaw);
  if (!name.trim()) return;
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  if (p.notes && p.notes[name.trim()] != null) return;
  p.addNote(name);
  persistPlayer(dispatch, getState, p);
};

export const onSelectNote = (name) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.setSelectedNoteName(name || '');
  persistPlayer(dispatch, getState, p);
};

export const onUpdateNoteContent = (noteName, text) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.updateNoteContent(noteName, text);
  persistPlayer(dispatch, getState, p);
};

export const onDeleteNote = () => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  const name = p.getSelectedNoteName();
  if (!name) return;
  p.deleteNote(name);
  persistPlayer(dispatch, getState, p);
};

export const onAddBonusLanguage = (lang) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.addBonusLanguage(lang);
  persistPlayer(dispatch, getState, p);
};

export const onRemoveBonusLanguage = (lang) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.removeBonusLanguage(lang);
  persistPlayer(dispatch, getState, p);
};

const SPELL_OPTION_KEYS = ['domain1', 'domain2', 'specialized', 'forbidden1', 'forbidden2', 'moralAlignment', 'ethicalAlignment'];

export const onSetPlayerSpellOption = (key, value) => (dispatch, getState) => {
  if (!SPELL_OPTION_KEYS.includes(key)) return;
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  if (typeof value !== 'string') return;
  p[key] = value;
  // Druid: if one axis is non-neutral, the other becomes Neutral
  if (p.getClass() === 'Druid') {
    if (key === 'moralAlignment') {
      const other = druidMoralToEthical(value);
      if (other != null) p.ethicalAlignment = other;
    } else if (key === 'ethicalAlignment') {
      const other = druidEthicalToMoral(value);
      if (other != null) p.moralAlignment = other;
    }
  }
  persistPlayer(dispatch, getState, p);
};

export const onPlayerLearnSpell = (spell_link) => (dispatch, getState) => {
  withPlayerSpellbook(getState, (s) => s.learnSpell(spell_link));
  const player = getState().playerSheet?.player;
  if (player) persistPlayer(dispatch, getState, player);
};

export const onPlayerUnlearnSpell = (spell_link) => (dispatch, getState) => {
  withPlayerSpellbook(getState, (s) => s.unlearnSpell(spell_link));
  const player = getState().playerSheet?.player;
  if (player) persistPlayer(dispatch, getState, player);
};

export const onPlayerLearnUnlearnSpell = (spell_link) => (dispatch, getState) => {
  withPlayerSpellbook(getState, (s) => s.learnUnlearnSpell(spell_link));
  const player = getState().playerSheet?.player;
  if (player) persistPlayer(dispatch, getState, player);
};

export const onPlayerPrepareSpell = (spell_link) => (dispatch, getState) => {
  withPlayerSpellbook(getState, (s) => s.prepareSpell(spell_link));
  const player = getState().playerSheet?.player;
  if (player) persistPlayer(dispatch, getState, player);
};

export const onPlayerUnprepareSpell = (spell_link) => (dispatch, getState) => {
  withPlayerSpellbook(getState, (s) => s.unprepareSpell(spell_link));
  const player = getState().playerSheet?.player;
  if (player) persistPlayer(dispatch, getState, player);
};

export const onPlayerUseSpell = (spell_link) => (dispatch, getState) => {
  withPlayerSpellbook(getState, (s) => s.useSpell(spell_link));
  const player = getState().playerSheet?.player;
  if (player) persistPlayer(dispatch, getState, player);
};

export const onPlayerUseGnomeSpell = (link) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p || p.getRace?.() !== 'Gnome') return;
  p.useGnomeSpell(link);
  persistPlayer(dispatch, getState, p);
};

export const onPlayerRefreshSpell = () => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (player) player.resetGnomeSpellUses();
  withPlayerSpellbook(getState, (s) => s.refreshSpell());
  const playerAfter = getState().playerSheet?.player;
  if (playerAfter) persistPlayer(dispatch, getState, playerAfter);
};

export const onPlayerPrepareDomainSpell = (level, spell_link) => (dispatch, getState) => {
  withPlayerSpellbook(getState, (s) => s.prepareDomainSpell(level, spell_link));
  const player = getState().playerSheet?.player;
  if (player) persistPlayer(dispatch, getState, player);
};

export const onPlayerUnprepareDomainSpell = (level, spell_link) => (dispatch, getState) => {
  withPlayerSpellbook(getState, (s) => s.unprepareDomainSpell(level, spell_link));
  const player = getState().playerSheet?.player;
  if (player) persistPlayer(dispatch, getState, player);
};

export const onPlayerUseDomainSpell = (spell_link) => (dispatch, getState) => {
  withPlayerSpellbook(getState, (s) => s.useDomainSpell(spell_link));
  const player = getState().playerSheet?.player;
  if (player) persistPlayer(dispatch, getState, player);
};

export { hydratePlayerSheet };

export const hydratePlayerSheetThunk = (app) => (dispatch) => {
  hydratePlayerSheet(dispatch, app);
};
