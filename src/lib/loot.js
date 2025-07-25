import { newArmor, newShield, newWeapon, randomMagicItem } from "./item";
import { loadFile, newGuid } from "./utils";

const REQUIRED_KEYS = ['Id', 'Level', 'GoldMod', 'GoodsMod', 'ItemsMod', 'Gold', 'Goods', 'Items', 'Timestamp'];

class Loot {
    constructor(level = 1, goldMod = 1, goodsMod = 1, itemsMod = 1) {
        this.Id = newGuid();
        this.Level = level;
        this.GoldMod = goldMod;
        this.GoodsMod = goodsMod;
        this.ItemsMod = itemsMod;
        this.Gold = this.generateGold();
        this.Goods = this.generateGoods();
        this.Items = this.generateItems();
        this.Timestamp = this.generateTimestamp();
    }

    load(data) {
        if (typeof data !== 'object' || data === null ||
            !REQUIRED_KEYS.every(key => data.hasOwnProperty(key))) {
            return this;
        }

        this.Id = data.Id;
        this.Level = data.Level;
        this.GoldMod = data.GoldMod;
        this.GoodsMod = data.GoodsMod;
        this.ItemsMod = data.ItemsMod;
        this.Gold = data.Gold;
        this.Goods = data.Goods;
        this.Items = data.Items;
        this.Timestamp = data.Timestamp;
        return this;
    }

    generateTimestamp() {
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const yyyy = now.getFullYear().toString().substring(2);
        const MM = pad(now.getMonth() + 1);
        const dd = pad(now.getDate());
        const hh = pad(now.getHours());
        const mm = pad(now.getMinutes());
        const ss = pad(now.getSeconds());
        return `${yyyy}/${MM}/${dd} ${hh}:${mm}:${ss}`;
    }

    rollDice(times, sides) {
        let total = 0;
        for (let i = 0; i < times; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        return total;
    }

    generateGold() {
        const table = {
            1: [{ range: [15, 29], roll: () => this.rollDice(1, 6) * 10 }, { range: [30, 52], roll: () => this.rollDice(1, 8) * 10 }, { range: [53, 95], roll: () => this.rollDice(2, 8) * 10 }, { range: [96, 100], roll: () => this.rollDice(1, 4) * 100 }],
            2: [{ range: [14, 23], roll: () => this.rollDice(1, 10) * 10 }, { range: [24, 43], roll: () => this.rollDice(2, 10) * 10 }, { range: [44, 95], roll: () => this.rollDice(4, 10) * 10 }, { range: [96, 100], roll: () => this.rollDice(2, 8) * 100 }],
            3: [{ range: [12, 21], roll: () => this.rollDice(2, 10) * 10 }, { range: [22, 41], roll: () => this.rollDice(4, 8) * 10 }, { range: [42, 95], roll: () => this.rollDice(1, 4) * 100 }, { range: [96, 100], roll: () => this.rollDice(1, 10) * 100 }],
            4: [{ range: [12, 21], roll: () => this.rollDice(3, 10) * 10 }, { range: [22, 41], roll: () => this.rollDice(4, 12) * 100 }, { range: [42, 95], roll: () => this.rollDice(1, 6) * 100 }, { range: [96, 100], roll: () => this.rollDice(1, 8) * 100 }],
            5: [{ range: [11, 19], roll: () => this.rollDice(1, 4) * 100 }, { range: [20, 38], roll: () => this.rollDice(1, 6) * 100 }, { range: [39, 95], roll: () => this.rollDice(1, 8) * 100 }, { range: [96, 100], roll: () => this.rollDice(1, 10) * 100 }],
            6: [{ range: [11, 18], roll: () => this.rollDice(1, 6) * 100 }, { range: [19, 37], roll: () => this.rollDice(1, 8) * 100 }, { range: [38, 95], roll: () => this.rollDice(1, 10) * 100 }, { range: [96, 100], roll: () => this.rollDice(1, 12) * 100 }],
            7: [{ range: [12, 18], roll: () => this.rollDice(1, 10) * 100 }, { range: [19, 35], roll: () => this.rollDice(1, 12) * 100 }, { range: [36, 93], roll: () => this.rollDice(2, 6) * 100 }, { range: [94, 100], roll: () => this.rollDice(3, 4) * 100 }],
            8: [{ range: [11, 15], roll: () => this.rollDice(1, 12) * 100 }, { range: [16, 29], roll: () => this.rollDice(2, 6) * 100 }, { range: [30, 87], roll: () => this.rollDice(2, 8) * 100 }, { range: [88, 100], roll: () => this.rollDice(3, 6) * 100 }],
            9: [{ range: [11, 15], roll: () => this.rollDice(2, 6) * 100 }, { range: [16, 29], roll: () => this.rollDice(2, 8) * 100 }, { range: [30, 85], roll: () => this.rollDice(5, 4) * 100 }, { range: [86, 100], roll: () => this.rollDice(2, 12) * 100 }],
            10: [{ range: [11, 24], roll: () => this.rollDice(2, 10) * 100 }, { range: [25, 79], roll: () => this.rollDice(6, 4) * 100 }, { range: [80, 100], roll: () => this.rollDice(5, 6) * 100 }],
            11: [{ range: [9, 14], roll: () => this.rollDice(3, 10) * 100 }, { range: [15, 75], roll: () => this.rollDice(4, 8) * 100 }, { range: [76, 100], roll: () => this.rollDice(4, 10) * 100 }],
            12: [{ range: [9, 14], roll: () => this.rollDice(3, 12) * 100 }, { range: [15, 100], roll: () => this.rollDice(1, 4) * 1000 }],
            13: [{ range: [9, 75], roll: () => this.rollDice(1, 4) * 1000 }, { range: [76, 100], roll: () => this.rollDice(1, 10) * 1000 }],
            14: [{ range: [9, 75], roll: () => this.rollDice(1, 6) * 1000 }, { range: [76, 100], roll: () => this.rollDice(1, 12) * 1000 }],
            15: [{ range: [4, 74], roll: () => this.rollDice(1, 8) * 1000 }, { range: [75, 100], roll: () => this.rollDice(3, 4) * 1000 }],
            16: [{ range: [4, 74], roll: () => this.rollDice(1, 12) * 1000 }, { range: [75, 100], roll: () => this.rollDice(3, 4) * 1000 }],
            17: [{ range: [4, 68], roll: () => this.rollDice(3, 4) * 1000 }, { range: [69, 100], roll: () => this.rollDice(2, 10) * 1000 }],
            18: [{ range: [3, 65], roll: () => this.rollDice(3, 6) * 1000 }, { range: [66, 100], roll: () => this.rollDice(5, 4) * 1000 }],
            19: [{ range: [3, 65], roll: () => this.rollDice(3, 8) * 1000 }, { range: [66, 100], roll: () => this.rollDice(3, 10) * 1000 }],
            20: [{ range: [3, 65], roll: () => this.rollDice(4, 8) * 1000 }, { range: [66, 100], roll: () => this.rollDice(4, 10) * 1000 }],
        };

        const lootOptions = table[Math.min(this.Level, 20)];
        const d100 = Math.floor(Math.random() * 100) + 1;

        for (let option of lootOptions) {
            const [min, max] = option.range;
            if (d100 >= min && d100 <= max) {
                const gold = option.roll() * this.GoldMod;

                const isFloat = Number(gold) === gold && gold % 1 !== 0;
                return isFloat ? parseFloat(gold.toFixed(2)) : Math.floor(gold);
            }
        }

        return this.rollDice(1, 6) * 10 * this.GoldMod; // Never zero
    }

    generateGems() {
        const pools = [
            [
                "Banded Agate", "Eye Agate", "Moss Agate", "Azurite", "Blue Quartz",
                "Hematite", "Lapis Lazuli", "Malachite", "Obsidian", "Rhodochrosite"
            ],
            [
                "Bloodstone", "Carnelian", "Chalcedony", "Chrysoprase", "Citrine",
                "Iolite", "Jasper", "Moonstone", "Onyx", "Peridot"
            ],
            [
                "Amber", "Amethyst", "Chrysoberyl", "Coral", "Garnet",
                "Jade", "Jet", "Pearl", "Spinel", "Tourmaline"
            ],
            [
                "Alexandrite", "Aquamarine", "Violet Garnet", "Black Pearl",
                "Blue Spinel", "Golden Topaz", "Deep Spinel", "Yellow Topaz",
                "Blue Garnet", "Green Spinel"
            ],
            [
                "Emerald", "Opal", "Sapphire", "Corundum", "Star Sapphire",
                "Star Ruby", "Fire Opal", "Blue Diamond", "Pink Diamond", "Jacinth"
            ]
        ];
        const rolls = [
            { range: [1, 25], cost: () => this.rollDice(4, 4) },
            { range: [26, 50], cost: () => this.rollDice(2, 4) * 10 },
            { range: [51, 70], cost: () => this.rollDice(4, 4) * 10 },
            { range: [71, 90], cost: () => this.rollDice(2, 4) * 100 },
            { range: [91, 99], cost: () => this.rollDice(4, 4) * 100 },
            { range: [100, 100], cost: () => this.rollDice(2, 4) * 1000 }
        ];
        const d100 = Math.floor(Math.random() * 100) + 1;
        let tier;
        for (let i = 0; i < rolls.length; i++) {
            const { range } = rolls[i];
            if (d100 >= range[0] && d100 <= range[1]) {
                tier = i;
                break;
            }
        }
        if (!pools[tier]) return { Name: "A strange bug", Cost: 4.04 };
        const name = pools[tier][Math.floor(Math.random() * pools[tier].length)];
        const cost = rolls[tier].cost();
        return { Name: name, Cost: cost };
    }

    generateArt() {
        const pools = [
            [
                "Silver Ewer",
                "Ivory Statuette",
                "Gold Bracelet",
                "Bronze Dagger",
                "Ceramic Vase",
                "Wooden Flute",
                "Leatherbound Book",
                "Copper Mirror",
                "Glass Perfume Bottle",
                "Bronze Token"
            ],
            [
                "Cloth of Gold Vestments",
                "Velvet Mask with Citrines",
                "Silver Chalice with Lapis",
                "Gold Embroidered Tapestry",
                "Beaded Silk Shawl",
                "Gold Filigree Box",
                "Jeweled Goblet",
                "Fine Silver Candlestick",
                "Gold Inlaid Comb",
                "Pearl Embellished Fan"
            ],
            [
                "Wool Tapestry",
                "Jade Inlaid Mug",
                "Carved Stone Relief",
                "Bronze Medallion",
                "Silver Picture Frame",
                "Painted Banner",
                "Gilded Frame Mirror",
                "Engraved Brass Bowl",
                "Ivory Chess Set",
                "Silver Filigree Vase"
            ],
            [
                "Moonstone Comb",
                "Jet Inlaid Sword",
                "Silver Inlaid Shield",
                "Gold Thread Embroidery",
                "Gemstone Brooch",
                "Enamel Portrait",
                "Lapis Lazuli Plate",
                "Pearl Hairpin",
                "Emerald Cuff",
                "Sapphire Ring"
            ],
            [
                "Ivory Harp",
                "Gold Idol",
                "Crystal Decanter",
                "Ruby Locket",
                "Emerald Brooch",
                "Spinel Bracelet",
                "Topaz Necklace",
                "Jacinth Pendant",
                "Diamond Studded Box",
                "Pearl Encrusted Box"
            ],
            [
                "Dragon Comb",
                "Topaz Bottle Stopper",
                "Electrum Dagger",
                "Garnet Scepter",
                "Ruby Sword Pommel",
                "Emerald Hairpin",
                "Sapphire Scabbard",
                "Gold Filigree Fan",
                "Pearl Inlaid Frame",
                "Spinel Candelabra"
            ],
            [
                "Sapphire Eye Patch",
                "Moonstone Pendant",
                "Masterpiece Painting",
                "Gilded Statue",
                "Enchanted Music Box",
                "Ivory Chessboard",
                "Gold Inlaid Clock",
                "Silver Filigree Mirror",
                "Emerald Candleholder",
                "Ruby Embellished Goblet"
            ],
            [
                "Silk and Velvet Mantle",
                "Sapphire Pendant",
                "Embroidered Glove",
                "Jeweled Anklet",
                "Gold Music Box",
                "Bejeweled Tiara",
                "Diamond Mosaic",
                "Ruby Brocade Tapestry",
                "Emerald Filigree Coffer",
                "Pearl Encrusted Goblet"
            ],
            [
                "Bejeweled Glove",
                "Jeweled Anklet",
                "Gold Music Box",
                "Enamel Trinket Box",
                "Gemstone Hairpin",
                "Gold Filigree Bracelet",
                "Ruby Inlaid Comb",
                "Emerald Bottle Stopper",
                "Sapphire Box",
                "Spinel Locket"
            ],
            [
                "Golden Circlet",
                "Aquamarine Necklace",
                "Pearl Strand",
                "Coral Bracelet",
                "Amber Scepter",
                "Jade Necklace",
                "Topaz Circlet",
                "Ruby Circlet",
                "Sapphire Circlet",
                "Emerald Circlet"
            ],
            [
                "Jeweled Gold Crown",
                "Electrum Ring",
                "Silver Inlaid Crown",
                "Platinum Band",
                "Gemstone Scepter",
                "Enchanted Tiara",
                "Ruby Ring",
                "Emerald Ring",
                "Sapphire Ring",
                "Diamond Ring"
            ],
            [
                "Ruby and Gold Ring",
                "Emerald Cup Set",
                "Diamond Chalice",
                "Sapphire Chalice",
                "Emerald Chalice",
                "Ruby Goblet",
                "Diamond Idol",
                "Emerald Idol",
                "Sapphire Idol",
                "Ruby Idol"
            ]
        ];

        const tiers = [
            { range: [1, 10], cost: () => this.rollDice(1, 10) * 10 },
            { range: [11, 25], cost: () => this.rollDice(3, 6) * 10 },
            { range: [26, 40], cost: () => this.rollDice(1, 6) * 100 },
            { range: [41, 50], cost: () => this.rollDice(1, 10) * 100 },
            { range: [51, 60], cost: () => this.rollDice(2, 6) * 100 },
            { range: [61, 70], cost: () => this.rollDice(3, 6) * 100 },
            { range: [71, 80], cost: () => this.rollDice(4, 6) * 100 },
            { range: [81, 85], cost: () => this.rollDice(5, 6) * 100 },
            { range: [86, 90], cost: () => this.rollDice(1, 4) * 1000 },
            { range: [91, 95], cost: () => this.rollDice(1, 6) * 1000 },
            { range: [96, 99], cost: () => this.rollDice(2, 4) * 1000 },
            { range: [100, 100], cost: () => this.rollDice(2, 6) * 1000 }
        ];

        const d100 = Math.floor(Math.random() * 100) + 1;
        let idx = tiers.findIndex(t => d100 >= t.range[0] && d100 <= t.range[1]);
        const name = pools[idx][Math.floor(Math.random() * pools[idx].length)];
        const cost = tiers[idx].cost();

        return { Name: name, Cost: cost };
    }

    generateGoods() {
        const table = {
            1: [{ range: [91, 95], type: 'gems', count: () => 1 }, { range: [96, 100], type: 'art', count: () => 1 }],
            2: [{ range: [82, 95], type: 'gems', count: () => this.rollDice(1, 3) }, { range: [96, 100], type: 'art', count: () => this.rollDice(1, 3) }],
            3: [{ range: [78, 95], type: 'gems', count: () => this.rollDice(1, 3) }, { range: [96, 100], type: 'art', count: () => this.rollDice(1, 3) }],
            4: [{ range: [71, 95], type: 'gems', count: () => this.rollDice(1, 4) }, { range: [96, 100], type: 'art', count: () => this.rollDice(1, 3) }],
            5: [{ range: [61, 95], type: 'gems', count: () => this.rollDice(1, 4) }, { range: [96, 100], type: 'art', count: () => this.rollDice(1, 4) }],
            6: [{ range: [57, 92], type: 'gems', count: () => this.rollDice(1, 4) }, { range: [93, 100], type: 'art', count: () => this.rollDice(1, 4) }],
            7: [{ range: [49, 88], type: 'gems', count: () => this.rollDice(1, 4) }, { range: [89, 100], type: 'art', count: () => this.rollDice(1, 4) }],
            8: [{ range: [46, 85], type: 'gems', count: () => this.rollDice(1, 6) }, { range: [86, 100], type: 'art', count: () => this.rollDice(1, 4) }],
            9: [{ range: [41, 80], type: 'gems', count: () => this.rollDice(1, 8) }, { range: [81, 100], type: 'art', count: () => this.rollDice(1, 4) }],
            10: [{ range: [36, 79], type: 'gems', count: () => this.rollDice(1, 8) }, { range: [80, 100], type: 'art', count: () => this.rollDice(1, 6) }],
            11: [{ range: [25, 74], type: 'gems', count: () => this.rollDice(1, 10) }, { range: [75, 100], type: 'art', count: () => this.rollDice(1, 6) }],
            12: [{ range: [18, 70], type: 'gems', count: () => this.rollDice(1, 10) }, { range: [71, 100], type: 'art', count: () => this.rollDice(1, 8) }],
            13: [{ range: [12, 66], type: 'gems', count: () => this.rollDice(1, 12) }, { range: [67, 100], type: 'art', count: () => this.rollDice(1, 10) }],
            14: [{ range: [12, 66], type: 'gems', count: () => this.rollDice(2, 8) }, { range: [67, 100], type: 'art', count: () => this.rollDice(2, 6) }],
            15: [{ range: [10, 65], type: 'gems', count: () => this.rollDice(2, 10) }, { range: [66, 100], type: 'art', count: () => this.rollDice(2, 8) }],
            16: [{ range: [8, 64], type: 'gems', count: () => this.rollDice(4, 6) }, { range: [65, 100], type: 'art', count: () => this.rollDice(2, 10) }],
            17: [{ range: [5, 63], type: 'gems', count: () => this.rollDice(4, 8) }, { range: [64, 100], type: 'art', count: () => this.rollDice(3, 8) }],
            18: [{ range: [5, 54], type: 'gems', count: () => this.rollDice(3, 12) }, { range: [55, 100], type: 'art', count: () => this.rollDice(3, 10) }],
            19: [{ range: [4, 50], type: 'gems', count: () => this.rollDice(6, 6) }, { range: [51, 100], type: 'art', count: () => this.rollDice(6, 6) }],
            20: [{ range: [3, 38], type: 'gems', count: () => this.rollDice(4, 10) }, { range: [39, 100], type: 'art', count: () => this.rollDice(7, 6) }]
        };
        const entries = table[Math.min(this.Level, 20)];
        const roll = Math.floor(Math.random() * 100) + 1;
        for (let { range, type, count } of entries) {
            if (roll >= range[0] && roll <= range[1]) {
                let n = count();
                n = Math.round(n * this.GoodsMod);
                const list = [];
                for (let i = 0; i < n; i++) {
                    list.push(type === 'gems' ? this.generateGems() : this.generateArt());
                }
                return { [type]: list };
            }
        }
        return {};
    }

    generateItems() {
        const lvl = Math.min(this.Level, 20);
        const table = {
            1: [{ range: [72, 95], type: 'mundane', count: () => 1 }, { range: [96, 100], type: 'minor', count: () => 1 }],
            2: [{ range: [50, 85], type: 'mundane', count: () => 1 }, { range: [86, 100], type: 'minor', count: () => 1 }],
            3: [{ range: [50, 79], type: 'mundane', count: () => this.rollDice(1, 3) }, { range: [80, 100], type: 'minor', count: () => 1 }],
            4: [{ range: [43, 62], type: 'mundane', count: () => this.rollDice(1, 4) }, { range: [63, 100], type: 'minor', count: () => 1 }],
            5: [{ range: [58, 67], type: 'mundane', count: () => this.rollDice(1, 4) }, { range: [68, 100], type: 'minor', count: () => this.rollDice(1, 3) }],
            6: [{ range: [55, 59], type: 'mundane', count: () => this.rollDice(1, 4) }, { range: [60, 99], type: 'minor', count: () => this.rollDice(1, 3) }, { range: [100, 100], type: 'medium', count: () => 1 }],
            7: [{ range: [52, 97], type: 'minor', count: () => this.rollDice(1, 3) }, { range: [98, 100], type: 'medium', count: () => 1 }],
            8: [{ range: [49, 96], type: 'minor', count: () => this.rollDice(1, 4) }, { range: [97, 100], type: 'medium', count: () => 1 }],
            9: [{ range: [44, 91], type: 'minor', count: () => this.rollDice(1, 4) }, { range: [92, 100], type: 'medium', count: () => 1 }],
            10: [{ range: [41, 88], type: 'minor', count: () => this.rollDice(1, 4) }, { range: [89, 99], type: 'medium', count: () => 1 }, { range: [100, 100], type: 'major', count: () => 1 }],
            11: [{ range: [32, 84], type: 'minor', count: () => this.rollDice(1, 4) }, { range: [85, 98], type: 'medium', count: () => 1 }, { range: [99, 100], type: 'major', count: () => 1 }],
            12: [{ range: [28, 82], type: 'minor', count: () => this.rollDice(1, 6) }, { range: [83, 97], type: 'medium', count: () => 1 }, { range: [98, 100], type: 'major', count: () => 1 }],
            13: [{ range: [20, 73], type: 'minor', count: () => this.rollDice(1, 6) }, { range: [74, 95], type: 'medium', count: () => 1 }, { range: [96, 100], type: 'major', count: () => 1 }],
            14: [{ range: [20, 58], type: 'minor', count: () => this.rollDice(1, 6) }, { range: [59, 92], type: 'medium', count: () => 1 }, { range: [93, 100], type: 'major', count: () => 1 }],
            15: [{ range: [12, 46], type: 'minor', count: () => this.rollDice(1, 10) }, { range: [47, 90], type: 'medium', count: () => 1 }, { range: [91, 100], type: 'major', count: () => 1 }],
            16: [{ range: [41, 46], type: 'minor', count: () => this.rollDice(1, 10) }, { range: [47, 90], type: 'medium', count: () => this.rollDice(1, 3) }, { range: [91, 100], type: 'major', count: () => 1 }],
            17: [{ range: [34, 83], type: 'medium', count: () => this.rollDice(1, 3) }, { range: [84, 100], type: 'major', count: () => 1 }],
            18: [{ range: [25, 80], type: 'medium', count: () => this.rollDice(1, 4) }, { range: [81, 100], type: 'major', count: () => 1 }],
            19: [{ range: [5, 70], type: 'medium', count: () => this.rollDice(1, 4) }, { range: [71, 100], type: 'major', count: () => 1 }],
            20: [{ range: [26, 65], type: 'medium', count: () => this.rollDice(1, 4) }, { range: [66, 100], type: 'major', count: () => this.rollDice(1, 3) }]
        };

        const entries = table[lvl];
        const d100 = Math.floor(Math.random() * 100) + 1;
        const items = [];

        for (let { range, type, count } of entries) {
            if (d100 >= range[0] && d100 <= range[1]) {
                let n = count();
                n = Math.round(n * this.ItemsMod);
                for (let i = 0; i < n; i++) {
                    if (type === 'mundane') items.push(this.generateMundane());
                    if (type === 'minor') items.push(randomMagicItem(0, this.Level, 'Minor'));
                    if (type === 'medium') items.push(randomMagicItem(0, this.Level, 'Medium'));
                    if (type === 'major') items.push(randomMagicItem(0, this.Level, 'Major'));
                }
                break;
            }
        }

        if (this.Level > 20) {
            const extraMajors = this.Level - 20;
            for (let i = 0; i < extraMajors; i++) {
                items.push(randomMagicItem(0, this.Level, 'Major'));
            }
        }

        if (items.length < 1 && this.ItemsMod >= 1) // At least one item
            items.push(this.generateMundane());

        return { items };
    }

    generateMundane() {
        function randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        const d100 = randomInt(1, 100);

        if (d100 <= 17) {
            const sub = randomInt(1, 100);
            let link;
            let qty = randomInt(1, 4);
            if (sub <= 12) {
                link = 'alchemists-fire';
            } else if (sub <= 24) {
                link = 'flask-of-acid';
                qty = randomInt(2, 4);
            } else if (sub <= 36) {
                link = 'smokestick';
            } else if (sub <= 48) {
                link = 'holy-water';
            } else if (sub <= 62) {
                link = 'vial-of-antitoxin';
            } else if (sub <= 74) {
                link = 'everburning-torch';
                qty = 1;
            } else if (sub <= 88) {
                link = 'tanglefoot-bag';
            } else {
                link = 'thunderstone';
            }
            return { ...loadFile("items")["Good"].find(x => x.Link === link), Quantity: qty };
        }

        if (d100 <= 50) {
            const sub = randomInt(1, 100);
            if (sub <= 80) {
                return { ...newArmor(0, this.Level), Quantity: 1 };
            } else if (sub <= 90) {
                let link;
                if (randomInt(1, 100) <= 50) {
                    link = 'darkwood-buckler';
                } else {
                    link = 'darkwood-shield';
                }
                return { ...loadFile("items")["Specific Shield"].find(x => x.Link === link), Quantity: 1 };
            } else {
                return { ...newShield(0, this.Level), Quantity: 1 };
            }
        }

        if (d100 <= 83) {
            return { ...newWeapon(0, this.Level), Quantity: 1 };
        }

        const sub = randomInt(1, 100);
        let link;
        if (sub <= 3) {
            link = 'adventuring-backpack';
        } else if (sub <= 6) {
            link = 'crowbar';
        } else if (sub <= 11) {
            link = 'lantern-bullseye';
        } else if (sub <= 16) {
            link = 'lock-simple';
        } else if (sub <= 21) {
            link = 'lock-average';
        } else if (sub <= 28) {
            link = 'lock-good';
        } else if (sub <= 35) {
            link = 'lock-superior';
        } else if (sub <= 40) {
            link = 'manacles-masterwork';
        } else if (sub <= 43) {
            link = 'mirror-small-steel';
        } else if (sub <= 46) {
            link = 'rope-silk';
        } else if (sub <= 53) {
            link = 'spyglass';
        } else if (sub <= 58) {
            link = 'artisans-tools-masterwork';
        } else if (sub <= 63) {
            link = 'climbers-kit';
        } else if (sub <= 68) {
            link = 'disguise-kit';
        } else if (sub <= 73) {
            link = 'healers-kit';
        } else if (sub <= 77) {
            link = 'holy-symbol-silver';
        } else if (sub <= 81) {
            link = 'hourglass';
        } else if (sub <= 88) {
            link = 'magnifying-glass';
        } else if (sub <= 95) {
            link = 'musical-instrument-masterwork';
        } else {
            link = 'thieves-tools-masterwork';
        }
        return { ...loadFile("items")["Good"].find(x => x.Link === link), Quantity: 1 };
    }

    serialize() {
        return {
            Id: this.Id,
            Level: this.Level,
            GoldMod: this.GoldMod,
            GoodsMod: this.GoodsMod,
            ItemsMod: this.ItemsMod,
            Gold: this.Gold,
            Goods: this.Goods,
            Items: this.Items,
            Timestamp: this.Timestamp
        };
    }
}

export default Loot;