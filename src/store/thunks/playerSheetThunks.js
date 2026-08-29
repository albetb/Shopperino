import Player from '../../lib/player';
import Spellbook from '../../lib/spellbook';
import * as db from '../../lib/storage';
import { cap } from '../../lib/utils';
import { getDefaultAlignmentForClass, druidMoralToEthical, druidEthicalToMoral } from '../../lib/alignment';
import { playerToSpellbookData } from '../../lib/player/playerSpellbookAdapter';
import { generateStartingEquipment } from '../../lib/player/startingEquipment';
import {
  setCharactersList,
  setSelectedCharacterIndex,
  setPlayer,
} from '../slices/playerSheetSlice';
import { setPersist } from '../slices/persistSlice';
import { addCardByLink } from '../slices/appSlice';
import { getEffectById } from '../../lib/item/effectsUtils';
import { getPotionByName, resolvePotionEffect } from '../../lib/item/potionEffects';
import AnimalCompanion from '../../lib/player/animalCompanion';
import Familiar from '../../lib/player/familiar';
import { getAnimalBaseByRef } from '../../lib/utils';

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

/**
 * Generate the class starting-equipment package the first time a character has
 * both a race and a class. Idempotent: the generator itself no-ops once its
 * one-time flag is set, so a later class change never regenerates.
 */
function maybeGenerateStartingEquipment(player) {
  if (!player) return;
  const race = player.getRace?.();
  const cls = player.getClass?.();
  if (race && cls && !player.startingEquipmentGenerated) {
    generateStartingEquipment(player);
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
  maybeGenerateStartingEquipment(p);
  persistPlayer(dispatch, getState, p);
};

export const onSetCharacterRace = (race) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.setRace(race);
  maybeGenerateStartingEquipment(p);
  persistPlayer(dispatch, getState, p);
};

export const onSetCharacterPortrait = (dataUrl) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.setPortrait(typeof dataUrl === 'string' ? dataUrl : '');
  persistPlayer(dispatch, getState, p);
};

export const onClearCharacterPortrait = () => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.setPortrait('');
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
  maybeGenerateStartingEquipment(p);
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

/**
 * Clear the level-up reminder: the player has opened the ability editor,
 * changed something, and closed it again. What they changed, and whether they
 * kept it, is deliberately not checked — the pill is a reminder that a decision
 * is owed, not a ledger of the decision made.
 */
export const onAcknowledgeAbilityIncreases = () => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.acknowledgeAbilityIncreases();
  persistPlayer(dispatch, getState, p);
};

export const onSetSkillRanks = (skillName, value) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.setSkillRanks(skillName, value);
  persistPlayer(dispatch, getState, p);
};

export const onSetSkillBonus = (skillName, value) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  p.setSkillBonus(skillName, value);
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

const SPELL_OPTION_KEYS = ['domain1', 'domain2', 'specialized', 'forbidden1', 'forbidden2'];
const ALIGNMENT_KEYS = ['moralAlignment', 'ethicalAlignment'];

export const onSetPlayerSpellOption = (key, value) => (dispatch, getState) => {
  if (!SPELL_OPTION_KEYS.includes(key)) return;
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  if (typeof value !== 'string') return;
  p[key] = value;
  persistPlayer(dispatch, getState, p);
};

export const onSetPlayerAlignment = (key, value) => (dispatch, getState) => {
  if (!ALIGNMENT_KEYS.includes(key)) return;
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

/**
 * Set the patron deity. Free text: a name outside deities.json is kept as a
 * homebrew patron, it simply cannot be alignment-checked.
 */
export const onSetPlayerDeity = (value) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  if (typeof value !== 'string') return;
  p.setDeity(value);
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

/**
 * Record how many spell swaps a spontaneous caster has spent. Never clamped to
 * what the level has earned — going over is flagged in the note, not blocked.
 */
export const onSetPlayerSpellSwapsUsed = (value) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p) return;
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return;
  p.spellSwapsUsed = Math.max(0, n);
  persistPlayer(dispatch, getState, p);
};

export const onPlayerUseGnomeSpell = (link) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.pss == null || app.pss < 0 || !app.psc?.[app.pss]) return;
  const p = db.getPlayerByIndex(app, app.pss);
  if (!p || p.getRace?.() !== 'Gnome') return;
  p.useGnomeSpell(link);
  persistPlayer(dispatch, getState, p);
};

/**
 * A full day's rest. Refreshes spell slots, gnome racial spells and every
 * per-day class-feature counter (rage, smite, turn undead, lay on hands, …)
 * in a single action, then persists once.
 *
 * The bonded creatures rest alongside their master: a companion, mount or
 * familiar left bleeding through the night was the character resting and the
 * creature not, which is nobody's reading of "long rest".
 */
export const onPlayerRest = () => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (player) {
    player.resetGnomeSpellUses();
    player.resetClassFeatureUses();
    // A rod's allowance is per day and comes back; a wand's 50 charges do not.
    player.resetHeldItemsOnRest();
    /* Every potion is over. Nothing in the set outlasts a night, and rest is
       the only moment the sheet can be sure of — there is no combat clock for
       a "1 min./level" duration to tick against. */
    player.resetPotionEffectsOnRest();
    // A night's natural healing: 1 HP per character level, never past the
    // maximum (combat.md). healAsIfRested floors damage at 0, which is the
    // same cap expressed the other way round.
    player.healAsIfRested();
    // The same rule per creature, counted in Hit Dice rather than levels.
    [player.companion, player.specialMount, player.familiar]
      .forEach((creature) => creature?.healAsIfRested?.());
  }
  withPlayerSpellbook(getState, (s) => s.refreshSpell());
  const playerAfter = getState().playerSheet?.player;
  if (playerAfter) persistPlayer(dispatch, getState, playerAfter);
};

/**
 * Spend or give back class-feature uses. The delta is signed, matching the
 * model: positive spends, negative returns. Never capped at the feature's
 * maximum — going over is flagged in the UI, not blocked.
 */
export const onUseClassFeature = (key, delta = 1) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.useClassFeature(key, delta);
  persistPlayer(dispatch, getState, player);
};

/** Clear one class-feature counter without resting the whole character. */
export const onResetClassFeature = (key) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.setClassFeatureUses(key, 0);
  persistPlayer(dispatch, getState, player);
};

/**
 * Wholeness of body: spend `amount` points from the pool and heal the monk by
 * the same amount in one step. Refuses at full health, since the points would
 * be thrown away — the card disables the button there too.
 */
export const onUseWholenessOfBody = (amount = 1) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  const maxHp = player.getMaxLife?.() ?? 0;
  const currentHp = player.getCurrentHp?.() ?? 0;
  const missing = Math.max(0, maxHp - currentHp);
  const spend = Math.min(Math.max(1, Math.floor(Number(amount) || 1)), missing);
  if (spend <= 0) return;
  player.useClassFeature('wholenessOfBody', spend);
  player.setDamage?.(Math.max(0, (player.getDamage?.() ?? 0) - spend));
  persistPlayer(dispatch, getState, player);
};

/** Choose or clear the monk bonus feat granted at one level. */
export const onSetMonkBonusFeat = (level, feat) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.setMonkBonusFeat(level, feat);
  persistPlayer(dispatch, getState, player);
};

/** Choose or clear the rogue special ability granted at one level. */
export const onSetRogueSpecialAbility = (level, ability) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.setRogueSpecialAbility(level, ability);
  persistPlayer(dispatch, getState, player);
};

/**
 * Start or end a barbarian rage. Starting spends one of the day's uses;
 * ending leaves the barbarian fatigued unless tireless rage has removed it.
 */
export const onToggleRage = () => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  if (player.isRaging()) player.endRage();
  else player.startRage();
  persistPlayer(dispatch, getState, player);
};

/** Name a new ranger favored enemy, spending a slot. */
export const onAddFavoredEnemy = (type, subtype = null) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player?.addFavoredEnemy(type, subtype)) return;
  persistPlayer(dispatch, getState, player);
};

/** Spend a slot raising an existing favored enemy by one step. */
export const onRaiseFavoredEnemy = (index) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player?.raiseFavoredEnemy(index)) return;
  persistPlayer(dispatch, getState, player);
};

/** Drop a favored enemy, returning every slot it held. */
export const onRemoveFavoredEnemy = (index) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.removeFavoredEnemyAt(index);
  persistPlayer(dispatch, getState, player);
};

/**
 * Mark or clear the fallen state (ex-paladin, ex-monk, …). Display only: no
 * derived value changes, the sheet simply says the features are lost.
 */
export const onSetExClass = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.setExClass(value);
  persistPlayer(dispatch, getState, player);
};

/** Choose the ranger's combat style. Permanent in the rules, set once here. */
export const onSetCombatStyle = (style) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player?.setCombatStyle(style)) return;
  persistPlayer(dispatch, getState, player);
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

// HP and health
export const onAdjustCurrentHp = (delta) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  // Adjust damage (the running total of HP lost), NOT healthModifier
  // (which is a permanent max-HP modifier). +delta heals → less damage;
  // -delta hurts → more damage.
  // D&D 3.5: a character dies at -10 HP, so allow current HP down to -10
  // (damage = maxHP + 10). Healing from negative HP is clamped to maxHP
  // (damage >= 0).
  const currentDamage = player.getDamage?.() ?? 0;
  const maxHp = player.getMaxLife?.() ?? 0;
  const minHp = -10;
  // newHp = (maxHp - newDamage) ∈ [minHp, maxHp]
  // → newDamage ∈ [0, maxHp - minHp]
  const newDamage = Math.max(0, Math.min(maxHp - minHp, currentDamage - delta));
  player.setDamage?.(newDamage);
  persistPlayer(dispatch, getState, player);
};

export const onSetMaxLife = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.maxLife = Math.max(1, Math.floor(Number(value) || 10));
  persistPlayer(dispatch, getState, player);
};

export const onSetHealthModifier = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.setHealthModifier?.(Math.floor(Number(value) || 0));
  persistPlayer(dispatch, getState, player);
};

/* Power Attack and Combat Expertise: the number the character is trading away
   this round. A stance rather than a resource, so it persists like rage does
   and a rest leaves it alone. Over the legal cap is stored as entered and
   flagged on the card, per the non-enforcing rule. */
export const onSetPowerAttack = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.setPowerAttack?.(value);
  persistPlayer(dispatch, getState, player);
};

export const onSetCombatExpertise = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.setCombatExpertise?.(value);
  persistPlayer(dispatch, getState, player);
};

/* Charges out of a held item — a wand, a staff, or a rod with a per-day
   allowance. Keyed by the item rather than the slot, so moving it between
   hands or unequipping it does not refill it. */
export const onSpendHeldItemCharges = (id, amount = 1) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.spendHeldItemCharges?.(id, amount);
  persistPlayer(dispatch, getState, player);
};

export const onResetHeldItemCharges = (id) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.resetHeldItemCharges?.(id);
  persistPlayer(dispatch, getState, player);
};

/**
 * Drink a potion, or apply an oil.
 *
 * One thunk for both because the bookkeeping is identical — the carried count
 * drops by one and something starts running — and only the effect table knows
 * which of the two it was. What varies is what the effect then does:
 *
 * - `heal` adds the rolled hit points, through the same path as a manual heal
 *   so the readout reports it the way it reports everything else.
 * - `cure` clears the conditions it is able to clear, and *lesser restoration*
 *   repairs the rolled points of ability damage.
 * - `condition` adds the real condition when the sheet already models one
 *   (*invisibility* → Invisible), and otherwise becomes a named pill.
 * - everything else starts a stat effect, which the breakdown box picks up.
 *
 * `roll` is what the dice showed — rolled for the player but editable, so a
 * table using physical dice records what actually happened.
 */
export const onUsePotion = (name, { target = '', roll = null } = {}) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  const raw = getPotionByName(name);
  const effect = raw ? resolvePotionEffect(raw) : null;
  if (!effect) return;

  player.removeInventoryItem(name, 'Potion', 1, { link: effect.link });

  const rolled = Number(roll);
  const amount = Number.isFinite(rolled) ? rolled : 0;

  if (effect.kind === 'heal') {
    /* Healing lowers the running damage total rather than raising a current-HP
       field, and is clamped the same way onAdjustCurrentHp clamps it: never
       past the maximum, never below -10. */
    const maxHp = player.getMaxLife?.() ?? 0;
    const currentDamage = player.getDamage?.() ?? 0;
    player.setDamage?.(Math.max(0, Math.min(maxHp + 10, currentDamage - amount)));
  } else if (effect.kind === 'cure') {
    effect.clears.forEach((condition) => player.removeCondition?.(condition, null));
    if (effect.repairs) player.repairAbilityDamage(amount, target || null);
    /* A cure with a lingering rider — remove fear's +4 for 10 minutes — still
       needs to be visible after the drink, so it runs like any other effect. */
    if (effect.situational) player.addPotionEffect(name, { roll: amount });
  } else if (effect.adds) {
    player.addCondition?.({ name: effect.adds });
  } else {
    player.addPotionEffect(name, { target, roll: Number.isFinite(rolled) ? rolled : null });
  }

  persistPlayer(dispatch, getState, player);
};

/** End one running effect, by the index getResolvedEffects reported. */
export const onRemovePotionEffect = (index) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.removePotionEffect(index);
  persistPlayer(dispatch, getState, player);
};

// Combat bonuses
export const onSetSpeedBonus = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.speedBonus = Math.max(0, Math.min(99, Math.floor(Number(value) || 0)));
  persistPlayer(dispatch, getState, player);
};

export const onSetInitiativeBonus = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.initiativeBonus = Math.max(-99, Math.min(99, Math.floor(Number(value) || 0)));
  persistPlayer(dispatch, getState, player);
};

export const onSetFortBonus = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.fortBonus = Math.max(-99, Math.min(99, Math.floor(Number(value) || 0)));
  persistPlayer(dispatch, getState, player);
};

export const onSetReflexBonus = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.reflexBonus = Math.max(-99, Math.min(99, Math.floor(Number(value) || 0)));
  persistPlayer(dispatch, getState, player);
};

export const onSetWillBonus = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.willBonus = Math.max(-99, Math.min(99, Math.floor(Number(value) || 0)));
  persistPlayer(dispatch, getState, player);
};

export const onSetAcBonus = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.acBonus = Math.max(-99, Math.min(99, Math.floor(Number(value) || 0)));
  persistPlayer(dispatch, getState, player);
};

export const onSetAcTouchBonus = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.acTouchBonus = Math.max(-99, Math.min(99, Math.floor(Number(value) || 0)));
  persistPlayer(dispatch, getState, player);
};

export const onSetAcFlatBonus = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.acFlatBonus = Math.max(-99, Math.min(99, Math.floor(Number(value) || 0)));
  persistPlayer(dispatch, getState, player);
};

// Conditions
export const onAddCondition = (cond) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  if (player.addCondition?.(cond)) persistPlayer(dispatch, getState, player);
};

export const onRemoveCondition = (name, ability = null) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.removeCondition?.(name, ability);
  persistPlayer(dispatch, getState, player);
};

// Feats
export const onAddFeat = (featName) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player || !featName) return;
  if (!player.feats) player.feats = [];
  player.feats.push(String(featName).trim());
  persistPlayer(dispatch, getState, player);
};

export const onRemoveFeatAt = (index) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player || !Array.isArray(player.feats)) return;
  if (index < 0 || index >= player.feats.length) return;
  player.feats.splice(index, 1);
  persistPlayer(dispatch, getState, player);
};

// Inventory
export const onAddInventoryItem = (name, type, number, link, opts) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.addInventoryItem(name, type, number, link, opts);
  persistPlayer(dispatch, getState, player);
};

export const onRemoveInventoryItem = (name, type, number, opts) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.removeInventoryItem(name, type, number, opts);
  persistPlayer(dispatch, getState, player);
};

// Equipment
export const onEquipItem = (slot, itemData) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.equipItem(slot, itemData);
  persistPlayer(dispatch, getState, player);
};

export const onUnequipSlot = (slot) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.unequipSlot(slot);
  persistPlayer(dispatch, getState, player);
};

function buildLinksForEntry(entry) {
  if (!entry?.Link && !entry?.link) return null;
  const baseLink = entry.Link || entry.link;
  const effectIds = Array.isArray(entry.effectIds) ? entry.effectIds : [];
  if (effectIds.length) {
    const effectLinks = effectIds.map((id) => getEffectById(id)?.Link).filter(Boolean);
    if (effectLinks.length) return [baseLink, ...effectLinks];
  }
  return baseLink;
}

export const onUpdateInventoryItemOverrides = (idx, overrides) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.setInventoryItemOverrides(idx, overrides);
  persistPlayer(dispatch, getState, player);
  const fresh = getState().playerSheet?.player;
  const entry = fresh?.getInventory?.()[idx];
  if (!entry) return;
  const links = buildLinksForEntry(entry);
  if (!links) return;
  dispatch(addCardByLink({
    links,
    bonus: entry.bonus || 0,
    overrides: entry.overrides || null,
    editKey: { kind: 'inventory', idx },
  }));
};

export const onUpdateEquipmentSlotOverrides = (slot, overrides) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.setEquipmentSlotOverrides(slot, overrides);
  persistPlayer(dispatch, getState, player);
  const fresh = getState().playerSheet?.player;
  const entry = fresh?.getEquipment?.()[slot];
  if (!entry) return;
  const links = buildLinksForEntry(entry);
  if (!links) return;
  dispatch(addCardByLink({
    links,
    bonus: entry.bonus || 0,
    overrides: entry.overrides || null,
    editKey: { kind: 'equipment', slot },
  }));
};

export const onUpdateInventoryItemMagic = (idx, magic) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.setInventoryItemMagic(idx, magic);
  persistPlayer(dispatch, getState, player);
  const fresh = getState().playerSheet?.player;
  const entry = fresh?.getInventory?.()[idx];
  if (!entry) return;
  const links = buildLinksForEntry(entry);
  if (!links) return;
  dispatch(addCardByLink({
    links,
    bonus: entry.bonus || 0,
    overrides: entry.overrides || null,
    editKey: { kind: 'inventory', idx },
  }));
};

export const onUpdateEquipmentSlotMagic = (slot, magic) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.setEquipmentSlotMagic(slot, magic);
  persistPlayer(dispatch, getState, player);
  const fresh = getState().playerSheet?.player;
  const entry = fresh?.getEquipment?.()[slot];
  if (!entry) return;
  const links = buildLinksForEntry(entry);
  if (!links) return;
  dispatch(addCardByLink({
    links,
    bonus: entry.bonus || 0,
    overrides: entry.overrides || null,
    editKey: { kind: 'equipment', slot },
  }));
};

// Gold
export const onAdjustPlayerGold = (delta) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.adjustGold(delta);
  persistPlayer(dispatch, getState, player);
};

export const onSetPlayerGold = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.setGold(value);
  persistPlayer(dispatch, getState, player);
};

// Animal companion (Druid / Ranger)
export const onSetCompanion = (ref) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  const base = getAnimalBaseByRef(ref);
  if (!ref || !base) return;
  const companion = new AnimalCompanion({ class: player.getClass?.(), level: player.getLevel?.() });
  companion.setRef(ref);
  companion.setName(base.name || '');
  player.companion = companion;
  persistPlayer(dispatch, getState, player);
};

export const onClearCompanion = () => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.companion = null;
  persistPlayer(dispatch, getState, player);
};

export const onRenameCompanion = (name) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const companion = player?.companion;
  if (!player || !companion) return;
  companion.setName(typeof name === 'string' ? name : '');
  persistPlayer(dispatch, getState, player);
};

export const onAdjustCompanionHp = (delta) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const companion = player?.companion;
  if (!player || !companion) return;
  // Mirror onAdjustCurrentHp: +delta heals (less damage), −delta hurts;
  // current HP allowed down to −10 (dead), capped at max HP when healing.
  const currentDamage = companion.getDamage?.() ?? 0;
  const maxHp = companion.getMaxLife?.() ?? 0;
  const minHp = -10;
  const newDamage = Math.max(0, Math.min(maxHp - minHp, currentDamage - delta));
  companion.setDamage(newDamage);
  persistPlayer(dispatch, getState, player);
};

export const onSetCompanionMaxLife = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const companion = player?.companion;
  if (!player || !companion) return;
  // Empty/null clears the override → the model falls back to the computed default.
  companion.setMaxLife(value === '' || value == null ? null : Math.max(0, Math.floor(Number(value) || 0)));
  persistPlayer(dispatch, getState, player);
};

/** Factory for the eight per-stat companion bonus setters. */
const setCompanionBonus = (key) => (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const companion = player?.companion;
  if (!player || !companion) return;
  companion.setStatBonus(key, Math.max(-99, Math.min(99, Math.floor(Number(value) || 0))));
  persistPlayer(dispatch, getState, player);
};

export const onSetCompanionAcBonus = setCompanionBonus('acBonus');
export const onSetCompanionAcTouchBonus = setCompanionBonus('acTouchBonus');
export const onSetCompanionAcFlatBonus = setCompanionBonus('acFlatBonus');
export const onSetCompanionInitBonus = setCompanionBonus('initBonus');
export const onSetCompanionSpeedBonus = setCompanionBonus('speedBonus');
export const onSetCompanionFortBonus = setCompanionBonus('fortBonus');
export const onSetCompanionReflexBonus = setCompanionBonus('reflexBonus');
export const onSetCompanionWillBonus = setCompanionBonus('willBonus');

export const onSetCompanionAttackOverride = (index, patch) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const companion = player?.companion;
  if (!player || !companion) return;
  companion.setAttackOverride(index, patch);
  persistPlayer(dispatch, getState, player);
};

// Familiar (Wizard / Sorcerer)
export const onSetFamiliar = (ref) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  const base = getAnimalBaseByRef(ref);
  if (!ref || !base) return;
  const familiar = new Familiar(player._familiarOwnerContext?.());
  familiar.setRef(ref);
  familiar.setName(base.name || '');
  player.familiar = familiar;
  persistPlayer(dispatch, getState, player);
};

export const onClearFamiliar = () => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.familiar = null;
  persistPlayer(dispatch, getState, player);
};

export const onRenameFamiliar = (name) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const familiar = player?.familiar;
  if (!player || !familiar) return;
  familiar.setName(typeof name === 'string' ? name : '');
  persistPlayer(dispatch, getState, player);
};

export const onAdjustFamiliarHp = (delta) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const familiar = player?.familiar;
  if (!player || !familiar) return;
  // Mirror onAdjustCurrentHp: +delta heals (less damage), −delta hurts;
  // current HP allowed down to −10 (dead), capped at max HP when healing.
  const currentDamage = familiar.getDamage?.() ?? 0;
  const maxHp = familiar.getMaxLife?.() ?? 0;
  const minHp = -10;
  const newDamage = Math.max(0, Math.min(maxHp - minHp, currentDamage - delta));
  familiar.setDamage(newDamage);
  persistPlayer(dispatch, getState, player);
};

export const onSetFamiliarMaxLife = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const familiar = player?.familiar;
  if (!player || !familiar) return;
  // Empty/null clears the override → the model falls back to ½ master HP.
  familiar.setMaxLife(value === '' || value == null ? null : Math.max(0, Math.floor(Number(value) || 0)));
  persistPlayer(dispatch, getState, player);
};

/** Factory for the eight per-stat familiar bonus setters. */
const setFamiliarBonus = (key) => (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const familiar = player?.familiar;
  if (!player || !familiar) return;
  familiar.setStatBonus(key, Math.max(-99, Math.min(99, Math.floor(Number(value) || 0))));
  persistPlayer(dispatch, getState, player);
};

export const onSetFamiliarAcBonus = setFamiliarBonus('acBonus');
export const onSetFamiliarAcTouchBonus = setFamiliarBonus('acTouchBonus');
export const onSetFamiliarAcFlatBonus = setFamiliarBonus('acFlatBonus');
export const onSetFamiliarInitBonus = setFamiliarBonus('initBonus');
export const onSetFamiliarSpeedBonus = setFamiliarBonus('speedBonus');
export const onSetFamiliarFortBonus = setFamiliarBonus('fortBonus');
export const onSetFamiliarReflexBonus = setFamiliarBonus('reflexBonus');
export const onSetFamiliarWillBonus = setFamiliarBonus('willBonus');

export const onSetFamiliarAttackOverride = (index, patch) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const familiar = player?.familiar;
  if (!player || !familiar) return;
  familiar.setAttackOverride(index, patch);
  persistPlayer(dispatch, getState, player);
};

// Special mount (Paladin). The creature follows the paladin's size, so there
// is nothing to pick — the mount is simply called or released.
export const onCallSpecialMount = () => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  if (!player.addSpecialMount()) return;
  persistPlayer(dispatch, getState, player);
};

export const onReleaseSpecialMount = () => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.removeSpecialMount();
  persistPlayer(dispatch, getState, player);
};

export const onRenameSpecialMount = (name) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const mount = player?.specialMount;
  if (!player || !mount) return;
  mount.setName(typeof name === 'string' ? name : '');
  persistPlayer(dispatch, getState, player);
};

export const onAdjustSpecialMountHp = (delta) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const mount = player?.specialMount;
  if (!player || !mount) return;
  // Mirrors onAdjustCompanionHp: +delta heals, −delta hurts, floor at −10.
  const currentDamage = mount.getDamage();
  const maxHp = mount.getMaxLife();
  const newDamage = Math.max(0, Math.min(maxHp + 10, currentDamage - delta));
  mount.setDamage(newDamage);
  persistPlayer(dispatch, getState, player);
};

export const onSetSpecialMountMaxLife = (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const mount = player?.specialMount;
  if (!player || !mount) return;
  mount.setMaxLife(value === '' || value == null ? null : Math.max(0, Math.floor(Number(value) || 0)));
  persistPlayer(dispatch, getState, player);
};

/**
 * Spend or give back summoning hours. Signed, like the class-feature tracker,
 * and never capped — going over the daily allowance is flagged, not blocked.
 */
export const onUseSpecialMountHours = (delta = 1) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const mount = player?.specialMount;
  if (!player || !mount) return;
  mount.useSummonHours(delta);
  persistPlayer(dispatch, getState, player);
};

export const onResetSpecialMountHours = () => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const mount = player?.specialMount;
  if (!player || !mount) return;
  mount.resetSummonHours();
  persistPlayer(dispatch, getState, player);
};

/** Factory for the eight per-stat mount bonus setters. */
const setSpecialMountBonus = (key) => (value) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const mount = player?.specialMount;
  if (!player || !mount) return;
  mount.setStatBonus(key, Math.max(-99, Math.min(99, Math.floor(Number(value) || 0))));
  persistPlayer(dispatch, getState, player);
};

export const onSetSpecialMountAcBonus = setSpecialMountBonus('acBonus');
export const onSetSpecialMountAcTouchBonus = setSpecialMountBonus('acTouchBonus');
export const onSetSpecialMountAcFlatBonus = setSpecialMountBonus('acFlatBonus');
export const onSetSpecialMountInitBonus = setSpecialMountBonus('initBonus');
export const onSetSpecialMountSpeedBonus = setSpecialMountBonus('speedBonus');
export const onSetSpecialMountFortBonus = setSpecialMountBonus('fortBonus');
export const onSetSpecialMountReflexBonus = setSpecialMountBonus('reflexBonus');
export const onSetSpecialMountWillBonus = setSpecialMountBonus('willBonus');

export const onSetSpecialMountAttackOverride = (index, patch) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  const mount = player?.specialMount;
  if (!player || !mount) return;
  mount.setAttackOverride(index, patch);
  persistPlayer(dispatch, getState, player);
};

// Wild shape (Druid). Assuming a form spends a use and heals as if rested;
// reverting is free. Neither is gated on having uses left — going over the
// daily allowance is flagged on the card, not blocked.
export const onEnterWildShape = (ref) => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  if (!player.enterWildShape(ref)) return;
  persistPlayer(dispatch, getState, player);
};

export const onExitWildShape = () => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.exitWildShape();
  persistPlayer(dispatch, getState, player);
};

/**
 * Restore a wild shape allowance without resting the whole character. The two
 * pools are independent — 'wildShape' covers animals and plants, and
 * 'elementalWildShape' the elemental forms.
 */
export const onResetWildShapeUses = (key = 'wildShape') => (dispatch, getState) => {
  const player = getState().playerSheet?.player;
  if (!player) return;
  player.setClassFeatureUses(key, 0);
  persistPlayer(dispatch, getState, player);
};

export { hydratePlayerSheet };

export const hydratePlayerSheetThunk = (app) => (dispatch) => {
  hydratePlayerSheet(dispatch, app);
};
