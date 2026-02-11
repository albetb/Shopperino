import { newRandomItem, itemRefLink } from './item';
import { computeTrueCost } from './shopPricing';
import { passingTime as runPassingTime } from './shopSimulation';
import { cap, getItemByRef, loadFile, newGuid, shopTypes } from './utils';

const BASE_ARCANE_CHANCE = 0.7;
const REQUIRED_KEYS = ['Id', 'Name', 'Level', 'CityLevel', 'PlayerLevel', 'Reputation', 'Stock', 'Gold', 'Time', 'ArcaneChance', 'ShopType', 'ItemModifier'];

/** Stock entry is either a ref { link, Number, PriceModifier, ItemType, CostOverride? } or ref+bonus { link, Bonus, ... } or full item. */
function isRefEntry(entry) {
    return entry && typeof entry.link === 'string';
}

/** Resolve a stock entry to an item-like object for display and trueCost (Name, Cost, PriceModifier, ItemType, Number, Link, Bonus?). */
function resolveEntry(entry) {
    if (!entry) return null;
    if (isRefEntry(entry)) {
        const ref = getItemByRef(entry.link);
        if (!ref || !ref.raw) return null;
        const base = ref.raw;
        const baseCost = entry.CostOverride != null ? entry.CostOverride : base.Cost;
        const bonus = entry.Bonus != null ? (typeof entry.Bonus === 'string' ? parseInt(entry.Bonus, 10) : entry.Bonus) : null;
        const name = bonus != null && !isNaN(bonus) ? `${base.Name} +${bonus}` : base.Name;
        return {
            Name: name,
            Cost: baseCost,
            PriceModifier: entry.PriceModifier ?? 0,
            ItemType: entry.ItemType,
            Number: entry.Number ?? 1,
            Link: entry.link,
            ...(bonus != null && !isNaN(bonus) ? { Bonus: bonus } : {}),
        };
    }
    return { ...entry };
}

class Shop {

    //#region ctor

    constructor(name = '', cityLevel = 0, playerLevel = 1) {
        this.Id = newGuid();
        this.Name = name;
        this.setGold(0);
        this.setShopLevel(0);
        this.setCityLevel(cityLevel);
        this.setPlayerLevel(playerLevel);
        this.setReputation(0);
        this.Stock = [];
        this.Time = 0;
        this.ArcaneChance = BASE_ARCANE_CHANCE;
        this.template();
    }

    template() {
        const tables = loadFile('tables');
        const shop = tables['Shop Types'].find(type => type.Name === (this.ShopType ?? 'None'));

        this.ShopType = shop.Name;
        this.Level = Math.max(this.Level, shop['Min level']);
        this.setGold(this.baseGold(this.PlayerLevel, this.Level));
        this.ItemModifier = { ...shop.Modifier };
        this.ArcaneChance = shop['Arcane Chance'] ?? BASE_ARCANE_CHANCE;
        this.ItemModifier.Ammo = (this.ItemModifier.Weapon ?? 0) * 0.6;
        this.ItemModifier.Shield = (this.ItemModifier.Armor ?? 0) * 0.4;
    }

    load(data) {
        if (typeof data !== 'object' || data === null ||
            !REQUIRED_KEYS.every(key => data.hasOwnProperty(key))) {
            return null;
        }

        this.Id = data.Id;
        this.Name = data.Name;
        this.Level = data.Level;
        this.CityLevel = data.CityLevel;
        this.PlayerLevel = data.PlayerLevel;
        this.Reputation = data.Reputation;
        this.Stock = data.Stock;
        this.Gold = data.Gold;
        this.Time = data.Time;
        this.ArcaneChance = data.ArcaneChance;
        this.ShopType = data.ShopType;
        this.ItemModifier = { ...data.ItemModifier };
        if (data.Seed != null) this.Seed = data.Seed;

        return this;
    }

    generateInventory(rng = null) {
        this.Stock = [];
        for (const key in this.ItemModifier) {
            for (let i = 0; i < this.modItemNumber(key, rng); i++) {
                const newItem = newRandomItem(key, this.Level, this.PlayerLevel, this.ArcaneChance, null, rng);
                this.addItem(newItem, key, rng);
            }
        }

        this.sortByCost();
        while (this.getInventoryValue() > this.Gold * 0.85 && this.Stock.length > 1) {
            this.Stock.pop();
        }
        const goldNoise = rng ? Math.floor(rng.nextFloat() * 200) : Math.random() * 200;
        this.setGold(Math.max(this.Gold - this.getInventoryValue(), goldNoise));
        this.sortByType();
    }

    addItem(addedItem, itemType, rng = null) {
        if (!addedItem) return;
        let found = false;
        const priceMod = rng ? Math.floor(rng.nextFloat() * 41) - 20 : Math.floor(Math.random() * 41) - 20;
        const isMagic = itemType === 'Magic Weapon' || itemType === 'Magic Armor';
        const hasAbilities = Array.isArray(addedItem.Link) || (addedItem.Ability && addedItem.Ability.length > 0);
        const simpleBonus = !hasAbilities && addedItem.Bonus != null && addedItem.BaseItemType && typeof addedItem.Link === 'string';

        if (isMagic && (hasAbilities || !simpleBonus)) {
            for (const item of this.Stock) {
                if (!isRefEntry(item) && item.Name === addedItem.Name && item.ItemType === itemType) {
                    item.Number += 1;
                    found = true;
                    break;
                }
            }
            if (!found) {
                addedItem.PriceModifier = priceMod;
                addedItem.Number = 1;
                addedItem.ItemType = itemType;
                this.Stock.push(addedItem);
            }
            return;
        }
        if (isMagic && simpleBonus) {
            const baseLink = `items/${addedItem.BaseItemType}/${addedItem.Link}`;
            const bonusNum = typeof addedItem.Bonus === 'string' ? parseInt(addedItem.Bonus, 10) : addedItem.Bonus;
            for (const entry of this.Stock) {
                if (isRefEntry(entry) && entry.link === baseLink && entry.ItemType === itemType && entry.Bonus === bonusNum) {
                    entry.Number = (entry.Number || 0) + 1;
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.Stock.push({
                    link: baseLink,
                    Bonus: bonusNum,
                    Number: 1,
                    PriceModifier: priceMod,
                    ItemType: itemType,
                    CostOverride: addedItem.Cost,
                });
            }
            return;
        }
        const refLink = itemRefLink({ ...addedItem, ItemType: itemType });
        if (refLink) {
            for (const entry of this.Stock) {
                if (isRefEntry(entry) && entry.link === refLink && entry.ItemType === itemType) {
                    entry.Number = (entry.Number || 0) + 1;
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.Stock.push({
                    link: refLink,
                    Number: 1,
                    PriceModifier: priceMod,
                    ItemType: itemType,
                });
            }
            return;
        }
        if (addedItem.Name) {
            for (const item of this.Stock) {
                if (!isRefEntry(item) && item.Name === addedItem.Name && item.ItemType === itemType) {
                    item.Number += 1;
                    found = true;
                    break;
                }
            }
            if (!found) {
                const fullItem = {
                    isCustom: true,
                    Name: cap(addedItem.Name),
                    ItemType: itemType,
                    Cost: addedItem.Cost !== undefined ? addedItem.Cost : 1,
                    Number: 1,
                    PriceModifier: priceMod,
                };
                this.Stock.push(fullItem);
            }
        }
    }

    modItemNumber(key, rng = null) {
        let num = this.ItemModifier[key];
        num *= 1 + 0.1 * (this.PlayerLevel - 1);
        num *= 1 + 0.1 * (this.CityLevel - 1);
        num *= 1 + 0.05 * this.Level;
        const frac = num - Math.floor(num);
        const addOne = rng ? (rng.nextFloat() < frac) : (Math.random() < frac);
        return Math.floor(num) + (addOne ? 1 : 0);
    }

    baseGold(PlayerLevel, Level) {
        return Math.floor(1000 * Math.pow(PlayerLevel, 1.4) * Math.pow(1.1, Level));
    }

    //#endregion

    //#region get / set

    getInventory() {
        return this.Stock.map(entry => {
            const resolved = resolveEntry(entry);
            if (!resolved) return null;
            return {
                ...resolved,
                Cost: this.trueCost(resolved, true),
            };
        }).filter(Boolean);
    }

    getInventoryValue() {
        return this.Stock.reduce((total, entry) => {
            const r = resolveEntry(entry);
            if (!r) return total;
            return total + this.trueCost(r, false) * (r.Number || 1);
        }, 0) * 0.95;
    }

    sortByType() {
        this.Stock.sort((a, b) => (resolveEntry(a)?.Name || '').localeCompare(resolveEntry(b)?.Name || ''));
        this.Stock.sort((a, b) => (a?.ItemType || '').localeCompare(b?.ItemType || ''));
    }

    sortByCost() {
        this.Stock.sort((a, b) => {
            const ra = resolveEntry(a);
            const rb = resolveEntry(b);
            return this.trueCost(ra, false) - this.trueCost(rb, false);
        });
    }

    setPlayerLevel(lv) {
        const partyLv = this.PlayerLevel;
        this.PlayerLevel = Math.max(1, Math.min(99, parseInt(lv)));
        const oldGold = this.baseGold(partyLv, this.Level);
        const newGold = this.baseGold(this.PlayerLevel, this.Level);
        this.setGold(this.Gold + newGold - oldGold);
    }

    setCityLevel(lv) {
        this.CityLevel = Math.max(0, Math.min(5, lv));
    }

    setShopLevel(lv) {
        lv = Math.max(0, Math.min(10, lv.toFixed(2)));
        const shopLv = this.Level ?? 0;
        this.Level = lv;
        const oldGold = this.baseGold(this.PlayerLevel, shopLv);
        const newGold = this.baseGold(this.PlayerLevel, lv);
        this.setGold(this.Gold + newGold - oldGold);
    }

    setReputation(rep) {
        this.Reputation = Math.max(-10, Math.min(10, rep));
    }

    setShopType(shopType) {
        this.ShopType = shopTypes().includes(shopType) ? shopType : 'None';
    }

    trueCost(item, forParty = true) {
        return computeTrueCost(item, forParty, this.Reputation, this.CityLevel);
    }

    setGold(gold) {
        if (gold == null || typeof gold !== 'number' || isNaN(gold)) {
            if (this.Gold == null || typeof this.Gold !== 'number' || isNaN(this.Gold)) {
                this.Gold = parseInt(Math.random() * 20);
            }
            return;
        }

        if (gold < 0) {
            this.Gold = parseInt(Math.random() * 20);
            return;
        }

        const isFloat = Number(gold) === gold && gold % 1 !== 0;
        this.Gold = isFloat ? parseFloat(gold.toFixed(2)) : Math.floor(gold);
    }

    //#endregion

    //#region time

    passingTime(hours = 0, days = 0) {
        runPassingTime(this, hours, days);
    }

    sellSomething() {
        const inv = this.getInventory();
        const itemNumber = inv.reduce((acc, item) => acc + item.Number, 0);
        if (Math.random() > 0.5) return;
        if (Math.random() >= itemNumber / 10) return;
        let num = Math.floor(Math.random() * Math.max(itemNumber / 10, 1));
        if (num === 0 && Math.random() <= 0.03 && itemNumber > 3) num = 1;
        for (let i = 0; i < num; i++) {
            if (inv.length === 0) break;
            const picked = inv[Math.floor(Math.random() * inv.length)];
            const name = picked.Name;
            const itemType = picked.ItemType;
            for (const entry of this.Stock) {
                const r = resolveEntry(entry);
                if (!r || r.Name !== name || r.ItemType !== itemType) continue;
                entry.Number = Math.max(0, (entry.Number || 1) - 1);
                this.setGold(this.Gold + this.trueCost(r, false));
                break;
            }
        }
    }

    reStock() {
        for (let key in this.ItemModifier) {
            const itemNumber = this.modItemNumber(key);
            const itemsPossessed = this.countItemType(key);
            if (itemsPossessed >= itemNumber) return;
            for (let i = 0; i < itemNumber - itemsPossessed; i++) {
                if (this.baseGold(this.PlayerLevel, this.Level) * 0.15 > this.Gold) {
                    break;
                }
                const item = newRandomItem(key, this.Level, this.PlayerLevel, this.ArcaneChance);
                if (item && item.Name) {
                    this.addItem(item, key);
                    this.setGold(this.Gold - item.Cost * 0.8);
                }
            }
        }
        this.sortByType();
    }

    countItemType(itemType) {
        return this.Stock.filter(item => item.ItemType === itemType).reduce((acc, item) => acc + item.Number, 0);
    }

    //#endregion

    //#region buy / sell

    buy(itemName, itemType, cost = 1, number = 1, link = "") {
        if (itemName.trim() === '' || number <= 0) return;
        const savedName = itemName.length > 64 ? cap(itemName).slice(0, 64) : cap(itemName);
        // preserve decimals (down to 0.01) instead of forcing integer >= 1
        const rawCost = parseFloat(cost);
        const normalizedCost = Number.isNaN(rawCost) ? 0 : rawCost;
        const savedCost = Math.min(Math.max(normalizedCost, 0.01), 999999999);
        const savedNumber = Math.min(Math.max(parseInt(number, 10), 0), 99);
        const fullLink = link && link.includes('/') ? link : null;

        const itemIndex = this.Stock.findIndex(entry => {
            const r = resolveEntry(entry);
            return r && r.Name === savedName && entry.ItemType === itemType;
        });

        if (itemIndex !== -1) {
            const entry = this.Stock[itemIndex];
            entry.Number = (entry.Number || 0) + savedNumber;
            const r = resolveEntry(entry);
            this.setGold(this.Gold - (r ? this.trueCost(r, true) * savedNumber : 0));
        } else if (fullLink) {
            const newEntry = {
                link: fullLink,
                Number: savedNumber,
                PriceModifier: 0,
                ItemType: itemType,
                CostOverride: savedCost,
            };
            this.Stock.push(newEntry);
            const r = resolveEntry(newEntry);
            this.setGold(this.Gold - (r ? this.trueCost(r, true) * savedNumber : 0));
        } else {
            // Custom item added by user: save completely as full object (no ref)
            const newItem = {
                isCustom: true,
                Name: savedName,
                ItemType: itemType,
                Cost: savedCost,
                Number: savedNumber,
                PriceModifier: 0,
            };
            this.Stock.push(newItem);
            this.setGold(this.Gold - savedCost * savedNumber);
        }
        this.sortByType();
    }

    sell(itemName, itemType, num = 1) {
        const itemIndex = this.Stock.findIndex(entry => {
            const r = resolveEntry(entry);
            return r && r.Name === cap(itemName) && entry.ItemType === itemType;
        });
        if (itemIndex === -1) return;

        const entry = this.Stock[itemIndex];
        const r = resolveEntry(entry);
        entry.Number = Math.max(0, (entry.Number || 1) - num);
        this.setGold(this.Gold + (r ? this.trueCost(r, false) * num : 0));
    }

    serialize() {
        const out = {
            Id: this.Id,
            Name: this.Name,
            Level: this.Level,
            CityLevel: this.CityLevel,
            PlayerLevel: this.PlayerLevel,
            Reputation: this.Reputation,
            Stock: this.Stock,
            Gold: this.Gold,
            Time: this.Time,
            ArcaneChance: this.ArcaneChance,
            ShopType: this.ShopType,
            ItemModifier: this.ItemModifier,
        };
        if (this.Seed != null) out.Seed = this.Seed;
        return out;
    }
}

export default Shop;
