import { loadFile } from '../utils';
import { strToEnum, enumToStr } from '../storageFormat';

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

/** Normalize Spells to [[id, prepared, used], ...]. Accepts legacy {Link, Prepared, Used} on load. */
function normalizeSpells(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(slot => {
        if (Array.isArray(slot) && slot.length >= 3)
            return [Number(slot[0]), Number(slot[1]) || 0, Number(slot[2]) || 0];
        if (slot && typeof slot === 'object' && slot.Link != null) {
            const id = getSpellIdByLink(slot.Link);
            if (id >= 0) return [id, Number(slot.Prepared) || 0, Number(slot.Used) || 0];
        }
        return null;
    }).filter(Boolean);
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
            Object.entries(raw).map(([lvl, val]) => [
                lvl,
                Array.isArray(val) ? val : (val && val.Link ? [val] : [])
            ])
        );
        this.Specialized = typeof data.Specialized === 'number' ? enumToStr('SpellSchools', data.Specialized) : (data.Specialized || '');
        this.Forbidden1 = typeof data.Forbidden1 === 'number' ? enumToStr('SpellSchools', data.Forbidden1) : (data.Forbidden1 || '');
        this.Forbidden2 = typeof data.Forbidden2 === 'number' ? enumToStr('SpellSchools', data.Forbidden2) : (data.Forbidden2 || '');

        return this;
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

    prepareSpell(spell_link) {
        const id = getSpellIdByLink(spell_link);
        if (id < 0) return;
        const slot = this.Spells.find(s => s[0] === id);
        if (!slot) {
            this.Spells = [...this.Spells, [id, 1, 0]];
            return;
        }
        this.Spells = this.Spells.map(s =>
            s[0] === id ? [id, (s[1] || 0) + 1, s[2] || 0] : s
        );
    }

    unprepareSpell(spell_link) {
        const id = getSpellIdByLink(spell_link);
        const removeWhenZero = ["Cleric", "Druid", "Bard", "Paladin"].includes(this.Class);
        this.Spells = this.Spells.map(s =>
            s[0] === id ? [s[0], Math.max(0, (s[1] || 0) - 1), s[2] || 0] : s
        );
        if (removeWhenZero)
            this.Spells = this.Spells.filter(s => (s[1] || 0) > 0);
    }

    useSpell(spell_link) {
        const id = getSpellIdByLink(spell_link);
        if (id < 0) return;
        const slot = this.Spells.find(s => s[0] === id);
        if (!slot) {
            this.Spells = [...this.Spells, [id, 0, 1]];
            return;
        }
        this.Spells = this.Spells.map(s =>
            s[0] === id ? [s[0], s[1] || 0, (s[2] || 0) + 1] : s
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
        this.Spells = this.Spells.map(s => [s[0], s[1] || 0, 0]);
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

    getClassDescription() {
        return loadFile("tables")["Class description"][this.Class] ?? "";
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
        const fromStorage = this.Spells.map(s => getSpellById(s[0])).filter(Boolean);
        if (this.Class === "Wizard") {
            const level0Ordered = this.getWizardLevel0Spells();
            const rest = fromStorage.filter(sp => !sp.Level.includes("Sor/Wiz 0"));
            return this._getSpells([...level0Ordered, ...rest], { name, school, level });
        }
        return this._getSpells(fromStorage, { name, school, level });
    }

    getPreparedSpells({ name, school, level } = {}) {
        const withPrepared = this.Spells.filter(s => (s[1] || 0) > 0).map(s => getSpellById(s[0])).filter(Boolean);
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
    getSpellPreparedUsed(link) {
        const id = getSpellIdByLink(link);
        const slot = this.Spells.find(s => s[0] === id);
        return slot ? { Prepared: slot[1] || 0, Used: slot[2] || 0 } : { Prepared: 0, Used: 0 };
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
            Forbidden2: strToEnum('SpellSchools', this.Forbidden2) >= 0 ? strToEnum('SpellSchools', this.Forbidden2) : -1
        };
    }
}

export default Spellbook;
