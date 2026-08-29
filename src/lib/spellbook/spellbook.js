import { loadFile } from '../utils';
import { strToEnum, enumToStr } from '../storageFormat';
import { getClassProgression } from '../player/classProgression';
import { spellAllowsSave } from './spellsUtils';
import {
    METAMAGIC_FEATS,
    modifiedSpellLevel,
    effectiveSpellLevel,
} from './metamagic';

const ALL_SPELLS = loadFile("spells");

/** Lookup spell by numeric id from spells.json. */
function getSpellById(id) {
    if (id == null || typeof id !== 'number') return null;
    return ALL_SPELLS.find(s => s.id === id) || null;
}

/** Resolve spell link to numeric id. */
function getSpellIdByLink(link) {
    if (!link) return -1;
    const s = ALL_SPELLS.find(x => x.Link === link);
    return s != null && typeof s.id === 'number' ? s.id : -1;
}

/**
 * Normalize Spells to `[[id, prepared, used, mm?], ...]`.
 *
 * The fourth element is the metamagic applied to *this* preparation, and it is
 * dropped while it is zero — which is what makes a three-element save written
 * before metamagic existed load unchanged rather than needing a migration.
 */
function normalizeSpells(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(slot => {
        if (!Array.isArray(slot) || slot.length < 3) return null;
        const base = [Number(slot[0]), Number(slot[1]) || 0, Number(slot[2]) || 0];
        const mm = Math.max(0, Math.floor(Number(slot[3]) || 0));
        return mm > 0 ? [...base, mm] : base;
    }).filter(Boolean);
}

/** The metamagic on one stored tuple. */
function mmOf(slot) {
    return Math.max(0, Math.floor(Number(slot?.[3]) || 0));
}

/** Build a tuple, omitting the metamagic element while it is zero. */
function tuple(id, prepared, used, mm) {
    return mm > 0 ? [id, prepared, used, mm] : [id, prepared, used];
}

const REQUIRED_KEYS = ['Name', 'Class', 'Level', 'Characteristic', 'Spells',
    'MoralAlignment', 'EthicalAlignment', 'Domain1', 'Domain2', 'UsedDomainSpells',
    'Specialized', 'Forbidden1', 'Forbidden2'];
export const CLASSES = ["Sorcerer", "Wizard", "Cleric", "Druid", "Bard", "Ranger", "Paladin"];
const CLASSCHARMAP = {
    "Sorcerer": 'Charisma',
    "Wizard": 'Intelligence',
    "Cleric": 'Wisdom',
    "Druid": 'Wisdom',
    "Bard": 'Charisma',
    "Ranger": 'Wisdom',
    "Paladin": 'Wisdom'
};
/** How each class is written in a spell's `Level` field ("Sor/Wiz 3", "Clr 1"). */
export const CLASSSPELLKEY = {
    "Sorcerer": 'Sor/Wiz',
    "Wizard": 'Sor/Wiz',
    "Cleric": 'Clr',
    "Druid": 'Drd',
    "Bard": 'Brd',
    "Ranger": 'Rgr',
    "Paladin": 'Pal'
};
export const MAGICSCHOOLS = [
    "Abjuration",
    "Conjuration",
    "Divination",
    "Enchantment",
    "Evocation",
    "Illusion",
    "Necromancy",
    "Transmutation",
    "Universal"
];
const FILTEREDSCHOOLS = MAGICSCHOOLS.filter(x => x !== "Universal");
export const DOMAINS = ["Air", "Animal", "Chaos", "Death", "Destruction",
    "Earth", "Evil", "Fire", "Good", "Healing",
    "Knowledge", "Law", "Luck", "Magic", "Plant",
    "Protection", "Strength", "Sun", "Travel", "Trickery",
    "War", "Water"];
export const ETHICALALIGNMENTS = ["Lawful", "Neutral", "Chaotic"];
export const MORALALIGNMENTS = ["Good", "Neutral", "Evil"];

class Spellbook {

    constructor(name = '') {
        this.Name = name;
        this.Class = "";
        this.Level = 1;
        this.Characteristic = 10;
        this.Spells = [];
        this.MoralAlignment = "Neutral";
        this.EthicalAlignment = "Neutral";
        this.Domain1 = "";
        this.Domain2 = "";
        this.UsedDomainSpells = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        /** @type {Record<number, Array<{ Link: string, Prepared: number, Used: number }>>} Prepared domain spells per level (can have both domains). */
        this.PreparedDomainSpells = {};
        this.Specialized = "";
        this.Forbidden1 = "";
        this.Forbidden2 = "";
        this.SpellSwapsUsed = 0;
        this.DoubledSpellLevels = [];
        this.MetamagicFeats = METAMAGIC_FEATS.slice();
    }

    load(data) {
        if (typeof data !== 'object' || data === null ||
            !REQUIRED_KEYS.every(key => data.hasOwnProperty(key))) {
            return this;
        }

        this.Name = data.Name;
        this.Class = typeof data.Class === 'number' ? enumToStr('Classes', data.Class) : (data.Class || '');
        this.Level = data.Level;
        this.Characteristic = data.Characteristic;
        this.Spells = normalizeSpells(data.Spells);
        this.MoralAlignment = typeof data.MoralAlignment === 'number' ? enumToStr('MoralAlignments', data.MoralAlignment) : (data.MoralAlignment || 'Neutral');
        this.EthicalAlignment = typeof data.EthicalAlignment === 'number' ? enumToStr('EthicalAlignments', data.EthicalAlignment) : (data.EthicalAlignment || 'Neutral');
        this.Domain1 = typeof data.Domain1 === 'number' ? enumToStr('Domains', data.Domain1) : (data.Domain1 || '');
        this.Domain2 = typeof data.Domain2 === 'number' ? enumToStr('Domains', data.Domain2) : (data.Domain2 || '');
        this.UsedDomainSpells = data.UsedDomainSpells;
        const raw = data.PreparedDomainSpells ?? {};
        this.PreparedDomainSpells = Object.fromEntries(
            Object.entries(raw).map(([lvl, val]) => [lvl, Array.isArray(val) ? val : []])
        );
        this.Specialized = typeof data.Specialized === 'number' ? enumToStr('SpellSchools', data.Specialized) : (data.Specialized || '');
        this.Forbidden1 = typeof data.Forbidden1 === 'number' ? enumToStr('SpellSchools', data.Forbidden1) : (data.Forbidden1 || '');
        this.Forbidden2 = typeof data.Forbidden2 === 'number' ? enumToStr('SpellSchools', data.Forbidden2) : (data.Forbidden2 || '');
        // Read defensively and left out of REQUIRED_KEYS: it is additive, and a
        // save written before it existed is still a valid spellbook.
        this.SpellSwapsUsed = Math.max(0, Math.floor(Number(data.SpellSwapsUsed) || 0));
        /* Spell levels a worn ring of wizardry doubles. Derived from the
           character's equipment rather than stored, so it is read defensively
           and never serialized — a spellbook with no player behind it simply
           has none. */
        this.DoubledSpellLevels = Array.isArray(data.DoubledSpellLevels)
            ? data.DoubledSpellLevels.map(Number).filter((n) => Number.isInteger(n) && n > 0)
            : [];
        /* Which metamagic feats may be offered. Absent means "no character
           behind this book" — the standalone Spellbook tab, which has no feats
           to check and so offers all nine and says so. An empty array is a
           different answer: a character who has none. */
        this.MetamagicFeats = Array.isArray(data.MetamagicFeats)
            ? data.MetamagicFeats.filter((name) => METAMAGIC_FEATS.includes(name))
            : METAMAGIC_FEATS.slice();

        return this;
    }

    /** How many of the earned spell swaps have been spent. */
    getSpellSwapsUsed() {
        return Math.max(0, Math.floor(Number(this.SpellSwapsUsed) || 0));
    }

    /** The swaps earned by level so far — one per level on the swap list. */
    getSpellSwapsEarned() {
        const current = Number(this.Level) || 0;
        return this.getSpellSwapLevels().filter(lvl => lvl <= current).length;
    }

    /**
     * Record swaps spent. Never clamped to what was earned: per the
     * non-enforcing rule in CLAUDE.md going over is flagged in the UI, not
     * blocked here.
     */
    setSpellSwapsUsed(value) {
        const n = Math.floor(Number(value));
        if (!Number.isFinite(n)) return;
        this.SpellSwapsUsed = Math.max(0, n);
    }

    setClass(_class) {
        if (CLASSES.includes(_class))
            this.Class = _class;
        // Wizard: do not add level 0 spells to storage; they are treated as known in UI only
    }

    setLevel(level) {
        if (level > 0)
            this.Level = level;
    }

    setCharacteristic(char) {
        if (char > 0)
            this.Characteristic = char;
    }

    setMoralAlignment(align) {
        if (!MORALALIGNMENTS.includes(align)) return;
        this.MoralAlignment = align;
        if (this.Domain1 === { "Good": "Evil", "Evil": "Good" }[this.MoralAlignment])
            this.Domain1 = "";
        if (this.Domain2 === { "Good": "Evil", "Evil": "Good" }[this.MoralAlignment])
            this.Domain2 = "";
    }

    setEthicalAlignment(align) {
        if (!ETHICALALIGNMENTS.includes(align)) return;
        this.EthicalAlignment = align;
        if (this.Domain1 === { "Lawful": "Chaos", "Chaotic": "Law" }[this.EthicalAlignment])
            this.Domain1 = "";
        if (this.Domain2 === { "Lawful": "Chaos", "Chaotic": "Law" }[this.EthicalAlignment])
            this.Domain2 = "";
    }

    setDomain1(domain) {
        if (!this.getPossibleDomain1().includes(domain) && domain !== "") return;
        this.Domain1 = domain;
    }

    setDomain2(domain) {
        if (!this.getPossibleDomain2().includes(domain) && domain !== "") return;
        this.Domain2 = domain;
    }

    setSpecialized(school) {
        if (!this.getPossibleSpecialized().includes(school) && school !== "") return;
        this.Specialized = school;
        if (school === "Divination")
            this.Forbidden2 = "";
    }

    setForbidden1(school) {
        if (!this.getPossibleForbidden1().includes(school) && school !== "") return;
        this.Forbidden1 = school;
    }

    setForbidden2(school) {
        if (this.Specialized === "Divination"
            || (!this.getPossibleForbidden2().includes(school) && school !== "")) return;
        this.Forbidden2 = school;
    }

    learnSpell(spell_link) {
        const id = getSpellIdByLink(spell_link);
        if (id < 0) return;
        if (this.Spells.some(s => s[0] === id)) return;
        this.Spells = [...this.Spells, [id, 0, 0]];
    }

    /** The metamagic feats this book may offer, in the order it lists them. */
    getAvailableMetamagic() {
        const available = Array.isArray(this.MetamagicFeats) ? this.MetamagicFeats : [];
        return METAMAGIC_FEATS.filter((name) => available.includes(name));
    }

    /** True when there is any metamagic to offer at all. */
    hasMetamagic() {
        return this.getAvailableMetamagic().length > 0;
    }

    /**
     * True for a class that chooses its metamagic at the moment of casting
     * rather than at preparation - the sorcerer and the bard, who have a list
     * of spells *known* with nothing to attach a choice to ahead of time.
     */
    isSpontaneous() {
        return ["Sorcerer", "Bard"].includes(this.Class);
    }

    /** The level a spell sits at on this class's own list, or null. */
    getSpellBaseLevel(spell) {
        const key = CLASSSPELLKEY[this.Class];
        if (!key || !spell) return null;
        const entry = String(spell.Level || '').split(',').map(p => p.trim())
            .find(p => p.startsWith(`${key} `));
        if (!entry) return null;
        const lvl = parseInt(entry.slice(key.length).trim(), 10);
        return Number.isFinite(lvl) ? lvl : null;
    }

    /** Same, by link. */
    getSpellBaseLevelByLink(link) {
        return this.getSpellBaseLevel(ALL_SPELLS.find(s => s.Link === link));
    }

    /** The slot a preparation of this spell with this metamagic occupies. */
    getModifiedLevel(link, mm = 0) {
        const base = this.getSpellBaseLevelByLink(link);
        if (base === null) return null;
        return modifiedSpellLevel(base, mm);
    }

    /**
     * The level every level-dependent effect is calculated from - the save DC
     * above all. Only Heighten moves it; every other metamagic leaves the spell
     * working at its own level while occupying a bigger slot.
     */
    getEffectiveLevel(link, mm = 0) {
        const base = this.getSpellBaseLevelByLink(link);
        if (base === null) return null;
        return effectiveSpellLevel(base, mm);
    }

    unlearnSpell(spell_link) {
        const id = getSpellIdByLink(spell_link);
        const spell = getSpellById(id);
        const existing = this.Spells.find(s => s[0] === id);
        if (existing && spell && !(this.Class === "Wizard" && spell.Level.includes("Sor/Wiz 0")))
            this.Spells = this.Spells.filter(s => s[0] !== id);
    }

    learnUnlearnSpell(spell_link) {
        const id = getSpellIdByLink(spell_link);
        const existing = this.Spells.find(s => s[0] === id);
        if (existing) this.unlearnSpell(spell_link);
        else this.learnSpell(spell_link);
    }

    prepareSpell(spell_link, mm = 0) {
        const id = getSpellIdByLink(spell_link);
        if (id < 0) return;
        const meta = Math.max(0, Math.floor(Number(mm) || 0));
        const slot = this.Spells.find(s => s[0] === id && mmOf(s) === meta);
        if (!slot) {
            this.Spells = [...this.Spells, tuple(id, 1, 0, meta)];
            return;
        }
        this.Spells = this.Spells.map(s =>
            s[0] === id && mmOf(s) === meta ? tuple(id, (s[1] || 0) + 1, s[2] || 0, meta) : s
        );
    }

    unprepareSpell(spell_link, mm = 0) {
        const id = getSpellIdByLink(spell_link);
        const meta = Math.max(0, Math.floor(Number(mm) || 0));
        const removeWhenZero = ["Cleric", "Druid", "Bard", "Paladin"].includes(this.Class);
        this.Spells = this.Spells.map(s =>
            s[0] === id && mmOf(s) === meta
                ? tuple(s[0], Math.max(0, (s[1] || 0) - 1), s[2] || 0, meta)
                : s
        );
        if (removeWhenZero)
            this.Spells = this.Spells.filter(s => (s[1] || 0) > 0);
        /* A metamagic'd row is a preparation and nothing else - with nothing
           prepared and nothing spent it is not a spell the book knows, it is a
           dead tuple against the storage budget. The plain row is left alone,
           because for a wizard that row *is* the spell being known. */
        this.Spells = this.Spells.filter(s =>
            mmOf(s) === 0 || (s[1] || 0) > 0 || (s[2] || 0) > 0
        );
    }

    useSpell(spell_link, mm = 0) {
        const id = getSpellIdByLink(spell_link);
        if (id < 0) return;
        const meta = Math.max(0, Math.floor(Number(mm) || 0));
        const slot = this.Spells.find(s => s[0] === id && mmOf(s) === meta);
        if (!slot) {
            this.Spells = [...this.Spells, tuple(id, 0, 1, meta)];
            return;
        }
        this.Spells = this.Spells.map(s =>
            s[0] === id && mmOf(s) === meta ? tuple(s[0], s[1] || 0, (s[2] || 0) + 1, meta) : s
        );
    }

    useDomainSpell(spell_link) {
        for (const [lvl, arr] of Object.entries(this.PreparedDomainSpells)) {
            const idx = (arr || []).findIndex(s => s && s.Link === spell_link);
            if (idx === -1) continue;
            const slot = arr[idx];
            if (slot.Used >= slot.Prepared) return;
            const next = arr.slice();
            next[idx] = { ...slot, Used: slot.Used + 1 };
            this.PreparedDomainSpells = { ...this.PreparedDomainSpells, [lvl]: next };
            return;
        }
    }

    prepareDomainSpell(level, spell_link) {
        if (this.Class !== "Cleric" || typeof level !== 'number' || level < 0 || level > 9) return;
        const domainSpellsAtLevel = this.getDomainSpells({ level });
        if (!domainSpellsAtLevel.some(s => s.Link === spell_link)) return;
        const arr = this.PreparedDomainSpells[level] || [];
        const idx = arr.findIndex(s => s && s.Link === spell_link);
        if (idx >= 0) {
            const slot = arr[idx];
            const next = arr.slice();
            next[idx] = { ...slot, Prepared: slot.Prepared + 1 };
            this.PreparedDomainSpells = { ...this.PreparedDomainSpells, [level]: next };
        } else {
            this.PreparedDomainSpells = { ...this.PreparedDomainSpells, [level]: [...arr, { Link: spell_link, Prepared: 1, Used: 0 }] };
        }
    }

    unprepareDomainSpell(level, spell_link) {
        if (typeof level !== 'number') return;
        const arr = this.PreparedDomainSpells[level];
        if (!arr || !arr.length) return;
        const idx = arr.findIndex(s => s && s.Link === spell_link);
        if (idx === -1) return;
        const slot = arr[idx];
        if (slot.Prepared <= 1) {
            const next = arr.filter((_, i) => i !== idx);
            this.PreparedDomainSpells = next.length ? { ...this.PreparedDomainSpells, [level]: next } : (() => { const o = { ...this.PreparedDomainSpells }; delete o[level]; return o; })();
        } else {
            const next = arr.slice();
            next[idx] = { ...slot, Prepared: slot.Prepared - 1 };
            this.PreparedDomainSpells = { ...this.PreparedDomainSpells, [level]: next };
        }
    }

    refreshSpell() {
        this.Spells = this.Spells
            .map(s => tuple(s[0], s[1] || 0, 0, mmOf(s)))
            /* A sorcerer's metamagic'd cast leaves a row behind that exists
               only to record the spent slot. Once the day resets there is
               nothing left in it to keep. */
            .filter(s => mmOf(s) === 0 || (s[1] || 0) > 0);
        this.refreshDomainSpell();
    }

    refreshDomainSpell() {
        this.UsedDomainSpells = this.UsedDomainSpells.map(() => 0);
        this.PreparedDomainSpells = Object.fromEntries(
            Object.entries(this.PreparedDomainSpells).map(([lvl, arr]) => [lvl, (arr || []).map(slot => ({ ...slot, Used: 0 }))])
        );
    }

    getCharBonus() {
        return Math.floor((this.Characteristic - 10) / 2);
    }

    getCharName() {
        return CLASSCHARMAP[this.Class];
    }

    getDifficultyClass(spell_level) {
        return 10 + this.getCharBonus() + spell_level;
    }

    /**
     * The save DC to show beside one spell, or null when the spell offers no
     * save. `focused` is always false here: Spell Focus is a feat, and a
     * standalone spellbook has no character behind it to hold feats. The player
     * sheet answers the same question through Player.getSpellSaveDCFor.
     *
     * @param {object} spell - A spell object from spells.json
     * @param {number} level - The spell's level for this class
     * @returns {{dc: number, focused: boolean} | null}
     */
    getSpellSaveDCFor(spell, level) {
        if (!spellAllowsSave(spell)) return null;
        return { dc: this.getDifficultyClass(Number(level) || 0), focused: false };
    }

    getSpellcastingDescription() {
        return loadFile("tables")["Spellcasting description"][this.Class] ?? "";
    }

    getDomainDescription() {
        if (this.Class !== "Cleric") return "";
        return (loadFile("tables")["Domains"][this.Domain1] ?? "")
            + (loadFile("tables")["Domains"][this.Domain2] ?? "");
    }

    getSpellsKnown() {
        if (this.Class === "Sorcerer")
            return loadFile("tables")["Spell slot"]["Sorcerer known"][Math.min(this.Level - 1, 19)];
        if (this.Class === "Bard")
            return loadFile("tables")["Spell slot"]["Bard known"][Math.min(this.Level - 1, 19)];
        if (this.Class === "Wizard")
            return 1 + this.getCharBonus() + 2 * this.Level
        return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    /**
     * True for a class whose spells known is a fixed per-level table that can
     * be exceeded — sorcerer and bard. A wizard's figure is only what levelling
     * hands out for free; copying scrolls legitimately puts them above it, so
     * it is never treated as a cap.
     */
    hasSpellsKnownCap() {
        return ["Sorcerer", "Bard"].includes(this.Class);
    }

    /** Spells currently known at each spell level, as { [level]: count }. */
    getKnownCountByLevel() {
        const key = CLASSSPELLKEY[this.Class] || '';
        if (!key) return {};
        return this.getLearnedSpells().reduce((acc, spell) => {
            const entry = String(spell.Level || '').split(',').map(p => p.trim())
                .find(p => p.startsWith(`${key} `));
            if (!entry) return acc;
            const lvl = parseInt(entry.slice(key.length).trim(), 10);
            if (Number.isFinite(lvl)) acc[lvl] = (acc[lvl] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * How many spells of a level are known beyond what the table allows, or 0.
     * Per CLAUDE.md the excess is reported, never blocked — the UI flags it.
     */
    getSpellsKnownOverCap(level) {
        if (!this.hasSpellsKnownCap()) return 0;
        const allowed = this.getSpellsKnown()[level];
        if (!Number.isFinite(allowed)) return 0;
        const known = this.getKnownCountByLevel()[level] || 0;
        return Math.max(0, known - allowed);
    }

    /**
     * The levels at which this class may trade one known spell for another —
     * the sorcerer's 4th and every even level after, the bard's 5th and every
     * third. Empty for a class that learns spells freely.
     *
     * Informational only: learning and unlearning stay unrestricted, so the
     * sheet lists these levels rather than gating the toggle on them.
     */
    getSpellSwapLevels() {
        const levels = getClassProgression(this.Class).spellSwapLevels;
        return Array.isArray(levels) ? levels.filter(n => Number.isFinite(Number(n))).map(Number) : [];
    }

    getSpontaneousSpells({ name, school, level } = {}) {
        let spell_list = [];
        if (this.Class === "Cleric") {
            if (this.MoralAlignment !== "Good")
                spell_list.push(...["inflict-minor-wounds", "inflict-light-wounds", "inflict-moderate-wounds",
                    "inflict-serious-wounds", "inflict-critical-wounds", "mass-inflict-light-wounds",
                    "mass-inflict-moderate-wounds", "mass-inflict-serious-wounds", "mass-inflict-critical-wounds"].splice(0, this.maxSpellLevel() + 1));

            if (this.MoralAlignment !== "Evil")
                spell_list.push(...["cure-minor-wounds", "cure-light-wounds", "cure-moderate-wounds",
                    "cure-serious-wounds", "cure-critical-wounds", "mass-cure-light-wounds",
                    "mass-cure-moderate-wounds", "mass-cure-serious-wounds", "mass-cure-critical-wounds"].splice(0, this.maxSpellLevel() + 1));
        }
        else if (this.Class === "Druid")
            spell_list = ["summon-natures-ally-i", "summon-natures-ally-ii", "summon-natures-ally-iii",
                "summon-natures-ally-iv", "summon-natures-ally-v", "summon-natures-ally-vi",
                "summon-natures-ally-vii", "summon-natures-ally-viii", "summon-natures-ally-ix"].splice(0, this.maxSpellLevel() + 1);

        const spell_temp = spell_list.map(x => ALL_SPELLS.find(y => y.Link === x))

        return this._getSpells(spell_temp, { name, school, level });
    }

    getSpellsPerDay() {
        const spells_per_day_tables = loadFile("tables")["Spell slot"]
        const wizardSpellsPerDay = spells_per_day_tables["Wizard per day"];
        const bardSpellsPerDay = spells_per_day_tables["Bard per day"];
        const clericSpellsPerDay = spells_per_day_tables["Cleric per day"]; // same as druid
        const paladinSpellsPerDay = spells_per_day_tables["Paladin per day"]; // same as ranger
        const sorcererSpellsPerDay = spells_per_day_tables["Sorcerer per day"];

        const _bonusSpells = spells_per_day_tables["Bonus spells"];

        if (!this.Class) {
            return [0]
        }

        const _baseSpellsPerDay = {
            "Sorcerer": sorcererSpellsPerDay,
            "Wizard": wizardSpellsPerDay,
            "Cleric": clericSpellsPerDay,
            "Druid": clericSpellsPerDay,
            "Bard": bardSpellsPerDay,
            "Ranger": paladinSpellsPerDay,
            "Paladin": paladinSpellsPerDay
        }[this.Class];

        // A class with no row in the table casts nothing, rather than throwing.
        if (!_baseSpellsPerDay) return new Array(10).fill(0);

        const lvl = Math.min(Math.max(this.Level, 1), 20);
        let base = _baseSpellsPerDay[lvl - 1];

        const mod = this.getCharBonus();

        if (mod < 0) {
            return new Array(10).fill(0);
        }

        let bonus = _bonusSpells[mod] || _bonusSpells[17];

        if (this.Class === "Ranger" || this.Class === "Paladin")
            base = [0].concat(base);

        bonus = bonus.map((v, i) => base[i] < 0 ? 0 : v);

        let spellNumberArray = base.map((v, i) => v < 0 ? 0 : v);
        /* A ring of wizardry doubles the base slots at one level. Applied
           before the ability bonus is added, because the ring's own text says
           bonus spells from a high ability score or from specialization are
           not doubled. */
        (this.DoubledSpellLevels || []).forEach((level) => {
            if (level < spellNumberArray.length) spellNumberArray[level] *= 2;
        });
        spellNumberArray = spellNumberArray.map((slots, i) => slots + bonus[i])
        return spellNumberArray.map((v, i) => i >= this.Characteristic - 9 ? 0 : v);
    }

    maxSpellLevel() {
        const arr = this.getSpellsPerDay();
        for (let i = arr.length - 1; i >= 0; i--) {
            if (arr[i] !== 0) {
                return i;
            }
        }
        return -1;
    }

    getAllSpells({ name, school, level } = {}) {
        return this._getSpells(ALL_SPELLS, { name, school, level });
    }

    /** For Wizard: all Sor/Wiz level 0 spells (not stored; shown as known/prepared in UI). */
    getWizardLevel0Spells() {
        if (this.Class !== "Wizard") return [];
        return this.getAllSpells({ level: 0 });
    }

    getLearnedSpells({ name, school, level } = {}) {
        /* One entry per spell, not per stored tuple: a wizard holding an
           ordinary and a maximized magic missile knows one spell, and it must
           count once against spells known and appear once in the list. */
        const seen = new Set();
        const fromStorage = this.Spells
            .filter(s => { if (seen.has(s[0])) return false; seen.add(s[0]); return true; })
            .map(s => getSpellById(s[0])).filter(Boolean);
        if (this.Class === "Wizard") {
            const level0Ordered = this.getWizardLevel0Spells();
            const rest = fromStorage.filter(sp => !sp.Level.includes("Sor/Wiz 0"));
            return this._getSpells([...level0Ordered, ...rest], { name, school, level });
        }
        return this._getSpells(fromStorage, { name, school, level });
    }

    getPreparedSpells({ name, school, level } = {}) {
        /* Plain preparations only. A metamagic'd one is a row of its own under
           the level whose slot it occupies - `getMetamagicEntries` supplies
           those - and listing it here as well would put it under its base
           level too, showing a 3rd-level preparation among the 1st-level
           spells with nothing to cast. */
        const withPrepared = this.Spells.filter(s => mmOf(s) === 0 && (s[1] || 0) > 0)
            .map(s => getSpellById(s[0])).filter(Boolean);
        if (this.Class === "Wizard") {
            const level0Canonical = this.getWizardLevel0Spells();
            const level0Ids = new Set(level0Canonical.map(s => s.id));
            const level0Prepared = level0Canonical.filter(s => withPrepared.some(p => p.id === s.id));
            const otherPrepared = withPrepared.filter(s => !level0Ids.has(s.id));
            return this._getSpells([...level0Prepared, ...otherPrepared], { name, school, level });
        }
        return this._getSpells(withPrepared, { name, school, level });
    }

    /** Prepared/Used for a spell link; for Wizard level 0 not in storage returns { Prepared: 0, Used: 0 }. */
    getSpellPreparedUsed(link, mm = 0) {
        const id = getSpellIdByLink(link);
        const meta = Math.max(0, Math.floor(Number(mm) || 0));
        const slot = this.Spells.find(s => s[0] === id && mmOf(s) === meta);
        return slot ? { Prepared: slot[1] || 0, Used: slot[2] || 0 } : { Prepared: 0, Used: 0 };
    }

    /**
     * Every metamagic'd preparation of one spell, for the popover that made
     * them. A plain preparation is not in here — it is the row the popover
     * hangs off.
     */
    getMetamagicPreparations(link) {
        const id = getSpellIdByLink(link);
        if (id < 0) return [];
        const base = this.getSpellBaseLevelByLink(link) ?? 0;
        return this.Spells
            .filter(s => s[0] === id && mmOf(s) > 0)
            .map(s => ({
                mm: mmOf(s),
                Prepared: s[1] || 0,
                Used: s[2] || 0,
                level: modifiedSpellLevel(base, mmOf(s)),
                effectiveLevel: effectiveSpellLevel(base, mmOf(s)),
            }))
            .sort((a, b) => a.level - b.level || a.mm - b.mm);
    }

    /**
     * Every metamagic'd preparation in the book, as rows to draw at the level
     * whose slot they actually occupy.
     *
     * This is why the same spell can appear under two different level cards:
     * an empowered *magic missile* is a 3rd-level preparation and belongs in
     * the 3rd-level card, beside the 3rd-level spells it is competing with for
     * slots. `spell` is the spell itself, so the row reads the same as any
     * other; `mm` is what makes it a different preparation.
     */
    getMetamagicEntries({ name, school } = {}) {
        return this.Spells
            .filter(s => mmOf(s) > 0 && (s[1] || 0) > 0)
            .map(s => {
                const spell = getSpellById(s[0]);
                if (!spell) return null;
                const base = this.getSpellBaseLevel(spell);
                if (base === null) return null;
                if (name && !spell.Name.toLowerCase().includes(name.toLowerCase())) return null;
                if (school && !spell.School.toLowerCase().includes(school.toLowerCase())) return null;
                const mm = mmOf(s);
                return {
                    spell,
                    mm,
                    baseLevel: base,
                    level: modifiedSpellLevel(base, mm),
                    effectiveLevel: effectiveSpellLevel(base, mm),
                    Prepared: s[1] || 0,
                    Used: s[2] || 0,
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.level - b.level || a.spell.Name.localeCompare(b.spell.Name));
    }

    /**
     * How many slots of one level are spoken for by prepared spells.
     *
     * Counted by the slot each preparation *occupies*, not by the spell's own
     * level - which is the whole point of metamagic and the reason this moved
     * out of the card heading and into the model.
     */
    getPreparedCountAtLevel(level, { school } = {}) {
        const target = Number(level);
        return this.Spells.reduce((sum, slot) => {
            const prepared = slot[1] || 0;
            if (prepared <= 0) return sum;
            const spell = getSpellById(slot[0]);
            if (!spell) return sum;
            const base = this.getSpellBaseLevel(spell);
            if (base === null) return sum;
            if (modifiedSpellLevel(base, mmOf(slot)) !== target) return sum;
            if (school && !spell.School.toLowerCase().includes(String(school).toLowerCase())) return sum;
            return sum + prepared;
        }, 0);
    }

    /**
     * How many of a level's slots a spontaneous caster has spent today.
     *
     * A sorcerer's usage is pooled per level rather than per spell, and a
     * metamagic'd cast spends a slot of the *modified* level - so an empowered
     * magic missile comes out of the 3rd-level pool, not the 1st.
     */
    getSpontaneousUsedAtLevel(level) {
        const target = Number(level);
        return this.Spells.reduce((sum, slot) => {
            const used = slot[2] || 0;
            if (used <= 0) return sum;
            const spell = getSpellById(slot[0]);
            if (!spell) return sum;
            const base = this.getSpellBaseLevel(spell);
            if (base === null) return sum;
            return modifiedSpellLevel(base, mmOf(slot)) === target ? sum + used : sum;
        }, 0);
    }

    /**
     * Casts left for one preparation: what is left of a prepared caster's own
     * copies, or what is left of the spontaneous caster's pool at the level the
     * cast would actually spend.
     */
    getRemainingFor(link, mm = 0) {
        const base = this.getSpellBaseLevelByLink(link);
        if (base === null) return 0;
        const level = modifiedSpellLevel(base, mm);
        if (this.isSpontaneous()) {
            const perDay = this.getSpellsPerDay()[level] || 0;
            return Math.max(0, perDay - this.getSpontaneousUsedAtLevel(level));
        }
        const { Prepared = 0, Used = 0 } = this.getSpellPreparedUsed(link, mm);
        return Math.max(0, Prepared - Used);
    }

    getDomainSpells({ name, school, level } = {}) {
        if (this.Class !== "Cleric") return [];
        return this._getSpells(ALL_SPELLS, { name, school, level, domain: this.Domain1 })
            .concat(this._getSpells(ALL_SPELLS, { name, school, level, domain: this.Domain2 }));
    }

    /** Returns prepared domain spells for spellbook tab: { level, spell, Prepared, Used }[] */
    getPreparedDomainSpells({ name, school } = {}) {
        if (this.Class !== "Cleric") return [];
        return Object.entries(this.PreparedDomainSpells).flatMap(([level, arr]) =>
            (arr || [])
                .filter(slot => slot && slot.Link)
                .map(slot => {
                    const spell = ALL_SPELLS.find(s => s.Link === slot.Link);
                    return spell ? { level: parseInt(level, 10), spell, Prepared: slot.Prepared, Used: slot.Used } : null;
                })
                .filter(Boolean)
        ).filter(({ spell }) => (!name || spell.Name.toLowerCase().includes(name.toLowerCase()))
            && (!school || spell.School.toLowerCase().includes(school.toLowerCase())));
    }

    getHasUsedDomainSpells() {
        if (this.Class !== "Cleric") return false;
        return Object.values(this.PreparedDomainSpells).some(arr => (arr || []).some(slot => slot && slot.Used > 0));
    }

    getHasUsedSpells() {
        const learnedIds = new Set(this.getLearnedSpells().map(x => x.id));
        return this.Spells.some(s => (s[2] || 0) > 0 && learnedIds.has(s[0]))
            || this.getHasUsedDomainSpells();
    }

    _getSpells(spells, { name, school, level, domain } = {}) {
        const classKeyMap = {
            "Sorcerer": 'Sor/Wiz',
            "Wizard": 'Sor/Wiz',
            "Cleric": 'Clr',
            "Druid": 'Drd',
            "Bard": 'Brd',
            "Ranger": 'Rgr',
            "Paladin": 'Pal'
        };
        let key = classKeyMap[this.Class];
        if (domain && DOMAINS.includes(domain))
            key = domain;

        if (this.Class === "Wizard" && (this.Forbidden1 || this.Forbidden2)) {
            const forbidden = [];
            if (this.Forbidden1) forbidden.push(this.Forbidden1);
            if (this.Forbidden2) forbidden.push(this.Forbidden2);

            spells = spells.filter(spell => {
                const schools = spell.School;
                for (let i = 0, len = forbidden.length; i < len; i++) {
                    if (schools.indexOf(forbidden[i]) !== -1) {
                        return false;
                    }
                }
                return true;
            });
        }

        return spells.filter(spell => {
            if (!spell || domain === "") return false;
            const parts = spell.Level.split(',').map(s => s.trim());
            const entry = parts.find(p => p.startsWith(key + ' '));
            if (!entry) return false;
            if (name && !spell.Name.toLowerCase().includes(name.toLowerCase())) {
                return false;
            }
            if (school && !spell.School.toLowerCase().includes(school.toLowerCase())) {
                return false;
            }
            if (["Druid", "Cleric"].includes(this.Class)) {
                const alignmentConflicts = {
                    "Lawful": "[Chaotic]",
                    "Chaotic": "[Lawful]",
                    "Good": "[Evil]",
                    "Evil": "[Good]"
                };

                const forbiddenMoral = alignmentConflicts[this.MoralAlignment];
                const forbiddenEthic = alignmentConflicts[this.EthicalAlignment];
                if ((forbiddenMoral && spell.School.includes(forbiddenMoral))
                    || (forbiddenEthic && spell.School.includes(forbiddenEthic)))
                    return false;
            }
            if (typeof level === 'number') {
                const lvlNum = parseInt(entry.slice(key.length).trim(), 10);
                if (lvlNum !== level) return false;
            }
            else {
                const lvlNum = parseInt(entry.slice(key.length).trim(), 10);
                if (lvlNum > this.maxSpellLevel()) return false;
            }
            return true;
        });
    }

    getPossibleDomain1() {
        return DOMAINS.filter(x => x !== { "Lawful": "Chaos", "Chaotic": "Law" }[this.EthicalAlignment]
            && x !== { "Good": "Evil", "Evil": "Good" }[this.MoralAlignment]
            && x !== this.Domain2);
    }

    getPossibleDomain2() {
        return DOMAINS.filter(x => x !== { "Lawful": "Chaos", "Chaotic": "Law" }[this.EthicalAlignment]
            && x !== { "Good": "Evil", "Evil": "Good" }[this.MoralAlignment]
            && x !== this.Domain1);
    }

    getPossibleSpecialized() {
        return FILTEREDSCHOOLS.filter(x => x !== this.Forbidden1
            && x !== this.Forbidden2);
    }

    getPossibleForbidden1() {
        return FILTEREDSCHOOLS.filter(x => x !== "Divination"
            && x !== this.Specialized
            && x !== this.Forbidden2);
    }

    getPossibleForbidden2() {
        return FILTEREDSCHOOLS.filter(x => x !== "Divination"
            && x !== this.Specialized
            && x !== this.Forbidden1);
    }

    serialize() {
        return {
            Name: this.Name,
            Class: strToEnum('Classes', this.Class) >= 0 ? strToEnum('Classes', this.Class) : -1,
            Level: this.Level,
            Characteristic: this.Characteristic,
            Spells: this.Spells,
            MoralAlignment: strToEnum('MoralAlignments', this.MoralAlignment) >= 0 ? strToEnum('MoralAlignments', this.MoralAlignment) : 0,
            EthicalAlignment: strToEnum('EthicalAlignments', this.EthicalAlignment) >= 0 ? strToEnum('EthicalAlignments', this.EthicalAlignment) : 0,
            Domain1: strToEnum('Domains', this.Domain1) >= 0 ? strToEnum('Domains', this.Domain1) : -1,
            Domain2: strToEnum('Domains', this.Domain2) >= 0 ? strToEnum('Domains', this.Domain2) : -1,
            UsedDomainSpells: this.UsedDomainSpells,
            PreparedDomainSpells: this.PreparedDomainSpells,
            Specialized: strToEnum('SpellSchools', this.Specialized) >= 0 ? strToEnum('SpellSchools', this.Specialized) : -1,
            Forbidden1: strToEnum('SpellSchools', this.Forbidden1) >= 0 ? strToEnum('SpellSchools', this.Forbidden1) : -1,
            Forbidden2: strToEnum('SpellSchools', this.Forbidden2) >= 0 ? strToEnum('SpellSchools', this.Forbidden2) : -1,
            // Omitted while zero, which is the overwhelmingly common case — the
            // storage budget is one ~5 MB key for every spellbook there is.
            ...(this.getSpellSwapsUsed() > 0 ? { SpellSwapsUsed: this.getSpellSwapsUsed() } : {}),
        };
    }
}

export default Spellbook;
