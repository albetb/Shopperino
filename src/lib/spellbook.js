import { loadFile, newGuid } from './utils';

const ALL_SPELLS = loadFile("spells");
const REQUIRED_KEYS = ['Id', 'Name', 'Class', 'Level', 'Characteristic', 'Spells',
    'MoralAlignment', 'EthicalAlignment', 'Domain1', 'Domain2', 'UsedDomainSpells'];
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
export const DOMAINS = ["Air", "Animal", "Chaos", "Death", "Destruction",
    "Earth", "Evil", "Fire", "Good", "Healing",
    "Knowledge", "Law", "Luck", "Magic", "Plant",
    "Protection", "Strength", "Sun", "Travel", "Trickery",
    "War", "Water"];
export const ETHICALALIGNMENTS = ["Lawful", "Neutral", "Chaotic"];
export const MORALALIGNMENTS = ["Good", "Neutral", "Evil"];

class Spellbook {

    constructor(name = '') {
        this.Id = newGuid();
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
    }

    load(data) {
        if (typeof data !== 'object' || data === null ||
            !REQUIRED_KEYS.every(key => data.hasOwnProperty(key))) {
            return this;
        }

        this.Id = data.Id;
        this.Name = data.Name;
        this.Class = data.Class;
        this.Level = data.Level;
        this.Characteristic = data.Characteristic;
        this.Spells = data.Spells;
        this.MoralAlignment = data.MoralAlignment;
        this.EthicalAlignment = data.EthicalAlignment;
        this.Domain1 = data.Domain1;
        this.Domain2 = data.Domain2;
        this.UsedDomainSpells = data.UsedDomainSpells;

        return this;
    }

    setClass(_class) {
        if (CLASSES.includes(_class))
            this.Class = _class;
        if (_class === "Wizard") { // add all level 0 spells to known
            const level_0_spells = this.getAllSpells({ level: 0 });
            level_0_spells.forEach(spell => {
                this.learnSpell(spell.Link);
            });
        }
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
        if (!this.getPossibleDomain1().includes(domain)) return;
        this.Domain1 = domain;
    }

    setDomain2(domain) {
        if (!this.getPossibleDomain2().includes(domain)) return;
        this.Domain2 = domain;
    }

    learnSpell(spell_link) {
        const existing = this.Spells.find(s => s.Link === spell_link);
        if (!existing) {
            this.Spells = [
                ...this.Spells,
                { Link: spell_link, Prepared: 0, Used: 0 }
            ];
        }
    }

    unlearnSpell(spell_link) {
        const existing = this.Spells.find(s => s.Link === spell_link);

        const spell = ALL_SPELLS.find(x => x.Link === spell_link);

        if (existing && !(this.Class === "Wizard" && spell.Level.includes("Sor/Wiz 0"))) {
            this.Spells = this.Spells.filter(s => s.Link !== spell_link);
        }
    }

    learnUnlearnSpell(spell_link) {
        const existing = this.Spells.find(s => s.Link === spell_link);
        if (existing) {
            this.unlearnSpell(spell_link);
        } else {
            this.learnSpell(spell_link);
        }
    }

    prepareSpell(spell_link) {
        // ensure the spell exists
        if (!this.Spells.some(s => s.Link === spell_link)) {
            this.Spells = [
                ...this.Spells,
                { Link: spell_link, Prepared: 1, Used: 0 }
            ];
            return;
        }
        // bump Prepared immutably
        this.Spells = this.Spells.map(s =>
            s.Link === spell_link
                ? { ...s, Prepared: (s.Prepared || 0) + 1 }
                : s
        );
    }

    unprepareSpell(spell_link) {
        this.Spells = this.Spells.map(s =>
            s.Link === spell_link
                ? { ...s, Prepared: Math.max(0, (s.Prepared || 0) - 1) }
                : s
        );
    }

    useSpell(spell_link) {
        // ensure the spell exists
        if (!this.Spells.some(s => s.Link === spell_link)) {
            this.Spells = [
                ...this.Spells,
                { Link: spell_link, Prepared: 0, Used: 1 }
            ];
            return;
        }
        // bump Prepared immutably
        this.Spells = this.Spells.map(s =>
            s.Link === spell_link
                ? { ...s, Used: (s.Used || 0) + 1 }
                : s
        );
    }

    useDomainSpell(lvl) {
        if (0 >= lvl || lvl >= 10) return;
        this.UsedDomainSpells = this.UsedDomainSpells.map((x, i) => i === lvl ? 1 : x);
    }

    refreshSpell() {
        this.Spells = this.Spells.map(s => ({ ...s, Used: 0 }));
        this.refreshDomainSpell();
    }

    refreshDomainSpell() {
        this.UsedDomainSpells = this.UsedDomainSpells.map(s => 0);
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
            return loadFile("tables")["Spell slot"]["Sorcerer known"][this.Level - 1];
        if (this.Class === "Bard")
            return loadFile("tables")["Spell slot"]["Bard known"][this.Level - 1];
        if (this.Class === "Wizard")
            return 1 + this.getCharBonus() + 2 * this.Level
        return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    getSpontaneousSpells() {
        let spell_list = [];
        if (this.Class === "Cleric") {
            if (this.MoralAlignment !== "Good")
                spell_list.push(...["inflict-minor-wounds", "inflict-light-wounds", "inflict-moderate-wounds",
                    "inflict-serious-wounds", "inflict-critical-wounds", "mass-inflict-light-wounds",
                    "mass-inflict-moderate-wounds", "mass-inflict-serious-wounds", "mass-inflict-critical-wounds"]);

            if (this.MoralAlignment !== "Evil")
                spell_list.push(...["cure-minor-wounds", "cure-light-wounds", "cure-moderate-wounds",
                    "cure-serious-wounds", "cure-critical-wounds", "mass-cure-light-wounds",
                    "mass-cure-moderate-wounds", "mass-cure-serious-wounds", "mass-cure-critical-wounds"]);
        }
        else if (this.Class === "Druid")
            spell_list = ["summon-natures-ally-i", "summon-natures-ally-ii", "summon-natures-ally-iii",
                "summon-natures-ally-iv", "summon-natures-ally-v", "summon-natures-ally-vi",
                "summon-natures-ally-vii", "summon-natures-ally-viii", "summon-natures-ally-ix"];

        return spell_list.map(x => ALL_SPELLS.find(y => y.Link === x));
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

    getLearnedSpells({ name, school, level } = {}) {
        const spells = this.Spells.map(x => ALL_SPELLS.find(y => y.Link === x.Link));
        return this._getSpells(spells, { name, school, level });
    }

    getPreparedSpells({ name, school, level } = {}) {
        const spells = this.Spells.filter(x => x.Prepared > 0)
            .map(x => ALL_SPELLS.find(y => y.Link === x.Link));
        return this._getSpells(spells, { name, school, level });
    }

    getDomainSpells({ name, school, level }) {
        if (this.Class !== "Cleric") return [];
        return this._getSpells(ALL_SPELLS, { name, school, level, domain: this.Domain1 })
            .concat(this._getSpells(ALL_SPELLS, { name, school, level, domain: this.Domain2 }));
    }

    getHasUsedDomainSpells() {
        if (this.Class !== "Cleric") return false;
        const end = Math.min(Math.max(this.maxSpellLevel(), 0), this.UsedDomainSpells.length - 1);
        for (let i = 0; i <= end; i++) {
            if (typeof this.UsedDomainSpells[i] === 'number' && this.UsedDomainSpells[i] > 0) {
                return true;
            }
        }
        return false;
    }

    getHasUsedSpells() {
        const filtered = this.getLearnedSpells().map(x => x.Link);
        return this.Spells
            .filter(x => x.Used > 0 && filtered.includes(x.Link)).length > 0
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
        const key = classKeyMap[this.Class];

        return spells.filter(spell => {
            if (!spell || domain === "") return false;
            if (domain && DOMAINS.includes(domain)) {
                return spell.Level.toLowerCase().includes(domain.toLowerCase());
            }
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

    serialize() {
        return {
            Id: this.Id,
            Name: this.Name,
            Class: this.Class,
            Level: this.Level,
            Characteristic: this.Characteristic,
            Spells: this.Spells,
            MoralAlignment: this.MoralAlignment,
            EthicalAlignment: this.EthicalAlignment,
            Domain1: this.Domain1,
            Domain2: this.Domain2,
            UsedDomainSpells: this.UsedDomainSpells
        };
    }
}

export default Spellbook;
