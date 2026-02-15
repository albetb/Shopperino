import { newRandomItem, itemRefLink } from '../item';
import { computeTrueCost } from './shopPricing';
import { passingTime as runPassingTime } from './shopSimulation';
import { getLinkByShareRef, getRefByShareRef, getShareFileCodeAndId } from './shareRef';
import { createPrng } from '../prng';
import { cap, getItemByRef, loadFile, shopTypes } from '../utils';
import { scaleGold, unscaleGold, scalePercent, unscalePercent, strToEnum, enumToStr } from '../storageFormat';

const BASE_ARCANE_CHANCE = 0.7;
const REQUIRED_KEYS = ['Name', 'Level', 'CityLevel', 'PlayerLevel', 'Reputation', 'Gold', 'Time', 'ArcaneChance', 'ShopType'];

/** Stock entry is a ref by link { link, ... } or by share ref { fileCode, id, ... }, or full item. */
function isRefEntry(entry) {
    return entry && (typeof entry.link === 'string' || (entry.fileCode != null && entry.id != null));
}

function getRefForEntry(entry) {
    if (entry.link) return getItemByRef(entry.link);
    if (entry.fileCode != null && entry.id != null) return getRefByShareRef(entry.fileCode, entry.id);
    return null;
}

/** Derive item type from link for display when entry doesn't persist ItemType (e.g. "items/Weapon/slug" -> "Weapon", "scrolls/Arcane/slug" -> "Scroll"). */
function itemTypeFromLink(link) {
    if (!link || typeof link !== 'string') return '';
    const parts = link.split('/').map(p => p.trim()).filter(Boolean);
    if (parts[0] === 'scrolls') return 'Scroll';
    if (parts[0] === 'items' && parts.length >= 2) return parts[1];
    return '';
}

/** Get (fileCode, id) for a stock entry (generated or user-added by ref). Returns null if not shareable. */
function getEntryRef(entry) {
    if (!entry) return null;
    if (entry.fileCode != null && entry.id != null) return { fileCode: entry.fileCode, id: entry.id };
    const link = entry.link || (entry.fileCode != null && entry.id != null ? getLinkByShareRef(entry.fileCode, entry.id) : null);
    if (!link) return null;
    return getShareFileCodeAndId(link);
}

/** Deterministic sort key for a stock entry so same items always sort in the same order (for identical cost/name/type). */
function entrySortKey(entry) {
    if (!entry) return '';
    if (entry.link) return 'L:' + entry.link + '|' + (entry.Bonus ?? '') + '|' + (entry.CostOverride ?? '');
    if (entry.fileCode != null && entry.id != null) return 'F:' + entry.fileCode + '|' + entry.id + '|' + (entry.Bonus ?? '') + '|' + (entry.CostOverride ?? '');
    return 'C:' + (entry.Name ?? '') + '|' + (entry.ItemType ?? '') + '|' + (entry.Cost ?? '');
}

/** Resolve a stock entry to an item-like object for display and trueCost (Name, Cost, PriceModifier, ItemType, Number, Link, Bonus?). */
function resolveEntry(entry) {
    if (!entry) return null;
    if (isRefEntry(entry)) {
        const ref = getRefForEntry(entry);
        if (!ref || !ref.raw) return null;
        const base = ref.raw;
        const link = entry.link || (entry.fileCode != null && entry.id != null ? getLinkByShareRef(entry.fileCode, entry.id) : null);
        if (!link) return null;
        const baseCost = entry.CostOverride != null ? entry.CostOverride : base.Cost;
        const bonus = entry.Bonus != null ? (typeof entry.Bonus === 'string' ? parseInt(entry.Bonus, 10) : entry.Bonus) : null;
        const name = bonus != null && !isNaN(bonus) ? `${base.Name} +${bonus}` : base.Name;
        const itemType = entry.ItemType != null && entry.ItemType !== '' ? entry.ItemType : itemTypeFromLink(link);
        return {
            Name: name,
            Cost: baseCost,
            PriceModifier: entry.PriceModifier ?? 0,
            ItemType: itemType,
            Number: entry.Number ?? 1,
            Link: link,
            ...(bonus != null && !isNaN(bonus) ? { Bonus: bonus } : {}),
        };
    }
    return { ...entry };
}

class Shop {

    //#region ctor

    constructor(name = '', cityLevel = 0, playerLevel = 1) {
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

    /** Set ItemModifier and ArcaneChance from tables.json by ShopType. Call after load or when ShopType changes. */
    applyItemModifierFromTables() {
        const tables = loadFile('tables');
        const shop = tables['Shop Types'] && tables['Shop Types'].find(type => type.Name === (this.ShopType ?? 'None'));
        if (!shop) return;
        this.ItemModifier = { ...(shop.Modifier || {}) };
        this.ItemModifier.Ammo = (this.ItemModifier.Weapon ?? 0) * 0.6;
        this.ItemModifier.Shield = (this.ItemModifier.Armor ?? 0) * 0.4;
        this.ArcaneChance = shop['Arcane Chance'] ?? BASE_ARCANE_CHANCE;
    }

    template() {
        const tables = loadFile('tables');
        const shop = tables['Shop Types'].find(type => type.Name === (this.ShopType ?? 'None'));

        this.ShopType = shop.Name;
        this.Level = Math.max(this.Level, shop['Min level']);
        this.setGold(this.baseGold(this.PlayerLevel, this.Level));
        this.applyItemModifierFromTables();
    }

    load(data) {
        if (typeof data !== 'object' || data === null ||
            !REQUIRED_KEYS.every(key => data.hasOwnProperty(key))) {
            return null;
        }

        this.Name = data.Name;
        this.Level = data.Level;
        this.CityLevel = data.CityLevel;
        this.PlayerLevel = data.PlayerLevel;
        this.Reputation = data.Reputation;
        this.Gold = typeof data.Gold === 'number' ? unscaleGold(data.Gold) : (Number(data.Gold) || 0);
        this.Time = data.Time;
        this.ArcaneChance = typeof data.ArcaneChance === 'number' ? unscalePercent(data.ArcaneChance) : (Number(data.ArcaneChance) || BASE_ARCANE_CHANCE);
        this.ShopType = typeof data.ShopType === 'number' ? enumToStr('ShopTypes', data.ShopType) : (data.ShopType || 'None');
        this.applyItemModifierFromTables();
        if (data.Seed != null) this.Seed = data.Seed;
        if (data.GenLevel != null) this.GenLevel = data.GenLevel;
        if (data.GenCityLevel != null) this.GenCityLevel = data.GenCityLevel;
        if (data.GenPlayerLevel != null) this.GenPlayerLevel = data.GenPlayerLevel;
        if (data.GenShopType != null) this.GenShopType = typeof data.GenShopType === 'number' ? enumToStr('ShopTypes', data.GenShopType) : data.GenShopType;

        if (this.Seed != null) {
            this.Stock = [];
            const rng = createPrng(this.Seed >>> 0);
            // Use saved Gen* so regeneration is identical every time; fallback to current Level/type if missing (e.g. old save)
            if (this.GenLevel == null) this.GenLevel = this.Level;
            if (this.GenCityLevel == null) this.GenCityLevel = this.CityLevel;
            if (this.GenPlayerLevel == null) this.GenPlayerLevel = this.PlayerLevel;
            if (this.GenShopType == null) this.GenShopType = this.ShopType;
            const savedLevel = this.Level;
            const savedCityLevel = this.CityLevel;
            const savedPlayerLevel = this.PlayerLevel;
            const savedShopType = this.ShopType;
            this.Level = this.GenLevel;
            this.CityLevel = this.GenCityLevel;
            this.PlayerLevel = this.GenPlayerLevel;
            this.ShopType = this.GenShopType;
            this.applyItemModifierFromTables();
            // Threshold gold is derived from Gen* (same as template at first generation): deterministic, no need to persist
            this.Gold = this.baseGold(this.GenPlayerLevel, this.GenLevel);
            this.generateInventory(rng);
            for (const entry of this.Stock) {
                if (entry.link && (entry.fileCode == null || entry.id == null)) {
                    const sr = getShareFileCodeAndId(entry.link);
                    if (sr) { entry.fileCode = sr.fileCode; entry.id = sr.id; }
                }
            }
            this.Level = savedLevel;
            this.CityLevel = savedCityLevel;
            this.PlayerLevel = savedPlayerLevel;
            this.ShopType = savedShopType;
            this.applyItemModifierFromTables();
            this.Gold = typeof data.Gold === 'number' ? unscaleGold(data.Gold) : (Number(data.Gold) || 0);
            this.applyUserAdditions(data.UserAdditions || []);
            this.applySold(data.Sold || []);
            // Restore Sold so future sells append to full history (otherwise only the latest sale would persist after refresh)
            const loadedSold = data.Sold;
            this.Sold = Array.isArray(loadedSold) && loadedSold.length ? loadedSold.map(row => [...row]) : [];
        } else {
            this.Stock = [];
        }

        return this;
    }

    /** Apply persisted delta: positive = sold (reduce/remove), negative = added (increase). Sold items: [fileCode, id, delta, bonus?]. */
    applySold(soldList) {
        if (!Array.isArray(soldList)) return;
        for (const row of soldList) {
            if (!Array.isArray(row) || row.length < 3) continue;
            const fileCodeStr = row[0] != null ? String(row[0]) : null;
            const idNum = Number(row[1]);
            if (fileCodeStr == null || Number.isNaN(idNum)) continue;
            const delta = Number(row[2]);
            const bonus = row.length >= 4 && row[3] != null ? row[3] : null;
            if (delta === 0) continue;
            if (delta > 0) {
                let remaining = delta;
                for (let i = this.Stock.length - 1; i >= 0 && remaining > 0; i--) {
                    const entry = this.Stock[i];
                    if (entry.userAdded || !isRefEntry(entry)) continue;
                    const ref = getEntryRef(entry);
                    if (!ref || String(ref.fileCode) !== fileCodeStr || Number(ref.id) !== idNum) continue;
                    const entryBonus = entry.Bonus != null ? entry.Bonus : null;
                    if (entryBonus !== bonus) continue;
                    const n = entry.Number || 1;
                    const deduct = Math.min(remaining, n);
                    entry.Number = Math.max(0, n - deduct);
                    remaining -= deduct;
                    if (entry.Number <= 0) this.Stock.splice(i, 1);
                }
            } else {
                const addQty = Math.min(99, Math.max(0, -delta));
                for (let i = 0; i < this.Stock.length; i++) {
                    const entry = this.Stock[i];
                    if (entry.userAdded || !isRefEntry(entry)) continue;
                    const ref = getEntryRef(entry);
                    if (!ref || String(ref.fileCode) !== fileCodeStr || Number(ref.id) !== idNum) continue;
                    const entryBonus = entry.Bonus != null ? entry.Bonus : null;
                    if (entryBonus !== bonus) continue;
                    entry.Number = Math.min(99, (entry.Number || 1) + addQty);
                    break;
                }
            }
        }
        this.sortByType();
    }

    /** Apply persisted user-added items (ref or custom) onto current Stock. */
    applyUserAdditions(userAdditions) {
        if (!Array.isArray(userAdditions)) return;
        for (const u of userAdditions) {
            if (Array.isArray(u)) {
                if (u[0] === 1 && u.length >= 5) {
                    const typeStr = enumToStr('CustomItemTypes', u[2]);
                    this.Stock.push({
                        isCustom: true,
                        Name: String(u[1] ?? 'Custom'),
                        ItemType: typeStr || 'Good',
                        Cost: unscaleGold(u[3]),
                        Number: Math.max(1, Math.min(99, (u[4] | 0) || 1)),
                        PriceModifier: 0,
                    });
                } else if (u[0] === 0 && u.length >= 4) {
                    const fileCode = u[1];
                    const id = u[2];
                    const link = getLinkByShareRef(fileCode, id);
                    if (!link) continue;
                    this.Stock.push({
                        fileCode,
                        id,
                        Number: Math.max(1, Math.min(99, (u[3] | 0) || 1)),
                        PriceModifier: 0,
                        CostOverride: u[4] != null ? unscaleGold(u[4]) : undefined,
                        Bonus: u[5] != null ? u[5] : undefined,
                        userAdded: true,
                    });
                }
            } else if (u && u.custom) {
                this.Stock.push({
                    isCustom: true,
                    Name: u.N ?? 'Custom',
                    ItemType: u.T ?? 'Good',
                    Cost: typeof u.C === 'number' ? u.C : parseFloat(u.C) || 0,
                    Number: Math.max(1, Math.min(99, (u.n | 0) || 1)),
                    PriceModifier: 0,
                });
            } else if (u && (u.f != null || u.fileCode != null) && (u.i != null || u.id != null)) {
                const fileCode = u.f ?? u.fileCode;
                const id = u.i ?? u.id;
                const link = getLinkByShareRef(fileCode, id);
                if (!link) continue;
                this.Stock.push({
                    fileCode,
                    id,
                    Number: Math.max(1, Math.min(99, (u.n | 0) || 1)),
                    PriceModifier: 0,
                    ItemType: u.T ?? 'Good',
                    CostOverride: u.c != null ? u.c : undefined,
                    Bonus: u.b != null ? u.b : undefined,
                    userAdded: true,
                });
            }
        }
        this.sortByType();
    }

    generateInventory(rng = null) {
        this.Stock = [];
        this.Sold = [];
        const modifierKeys = Object.keys(this.ItemModifier || {}).sort();
        for (const key of modifierKeys) {
            for (let i = 0; i < this.modItemNumber(key, rng); i++) {
                const newItem = newRandomItem(key, this.Level, this.PlayerLevel, this.ArcaneChance, null, rng);
                this.addItem(newItem, key, rng);
            }
        }

        this.sortByCost();
        this.GenLevel = this.Level;
        this.GenCityLevel = this.CityLevel;
        this.GenPlayerLevel = this.PlayerLevel;
        this.GenShopType = this.ShopType;
        // Threshold = this.Gold at entry (template gold on first run, baseGold(Gen*) on load); trim and final gold both deterministic from seed + Gen*
        const thresholdGold = this.Gold;
        while (this.getInventoryValue() > thresholdGold * 0.85 && this.Stock.length > 1) {
            this.Stock.pop();
        }
        const goldNoise = rng ? Math.floor(rng.nextFloat() * 200) : Math.random() * 200;
        this.setGold(Math.max(thresholdGold - this.getInventoryValue(), goldNoise));
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
        num *= 1 + 0.1 * this.CityLevel;
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
            if (!resolved || (resolved.Number || 0) <= 0) return null;
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
            const costDiff = this.trueCost(ra, false) - this.trueCost(rb, false);
            if (costDiff !== 0) return costDiff;
            const nameCmp = (ra?.Name || '').localeCompare(rb?.Name || '');
            if (nameCmp !== 0) return nameCmp;
            const typeCmp = (a?.ItemType || '').localeCompare(b?.ItemType || '');
            if (typeCmp !== 0) return typeCmp;
            return entrySortKey(a).localeCompare(entrySortKey(b));
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
            // Persist "added" to generated ref: use Sold with negative count (so refresh restores quantity)
            if (isRefEntry(entry) && !entry.userAdded) {
                const ref = getEntryRef(entry);
                if (ref) {
                    const prev = Array.isArray(this.Sold) ? this.Sold : [];
                    const bonus = entry.Bonus != null ? entry.Bonus : null;
                    const existingIdx = prev.findIndex(s => Array.isArray(s) && s.length >= 3 && String(s[0]) === String(ref.fileCode) && Number(s[1]) === Number(ref.id) && (s[3] ?? null) === bonus);
                    let next;
                    if (existingIdx >= 0) {
                        const e = prev[existingIdx];
                        next = [...prev];
                        const prevDelta = Number(e[2]);
                        next[existingIdx] = [e[0], e[1], (Number.isNaN(prevDelta) ? 0 : prevDelta) - savedNumber, e.length >= 4 ? e[3] : null];
                    } else {
                        next = [...prev, [ref.fileCode, ref.id, -savedNumber, bonus]];
                    }
                    this.Sold = next;
                }
            }
        } else if (fullLink) {
            const shareRef = getShareFileCodeAndId(fullLink);
            const newEntry = shareRef
                ? {
                    fileCode: shareRef.fileCode,
                    id: shareRef.id,
                    Number: savedNumber,
                    PriceModifier: 0,
                    ItemType: itemType,
                    CostOverride: savedCost,
                    userAdded: true,
                }
                : {
                    link: fullLink,
                    Number: savedNumber,
                    PriceModifier: 0,
                    ItemType: itemType,
                    CostOverride: savedCost,
                    userAdded: true,
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
            const type = entry.ItemType != null && entry.ItemType !== '' ? entry.ItemType : (r && itemTypeFromLink(r.Link));
            return r && r.Name === cap(itemName) && type === itemType;
        });
        if (itemIndex === -1) return;

        const entry = this.Stock[itemIndex];
        const r = resolveEntry(entry);
        const soldNum = Math.min(num, entry.Number || 1);
        entry.Number = Math.max(0, (entry.Number || 1) - num);
        this.setGold(this.Gold + (r ? this.trueCost(r, false) * soldNum : 0));
        // Persist sold count for generated items (ref entries that are not user-added) so refresh shows correct stock.
        // Use a mutable copy: Sold may be frozen (e.g. from Redux/persist), so never mutate in place.
        if (soldNum > 0 && isRefEntry(entry) && !entry.userAdded) {
            const ref = getEntryRef(entry);
            if (ref) {
                const prev = Array.isArray(this.Sold) ? this.Sold : [];
                const bonus = entry.Bonus != null ? entry.Bonus : undefined;
                const existingIdx = prev.findIndex(s => s[0] === ref.fileCode && s[1] === ref.id && (s[3] ?? null) === (bonus ?? null));
                let next;
                if (existingIdx >= 0) {
                    const e = prev[existingIdx];
                    next = [...prev];
                    next[existingIdx] = [e[0], e[1], (e[2] || 0) + soldNum, e[3]];
                } else {
                    next = [...prev, [ref.fileCode, ref.id, soldNum, bonus]];
                }
                this.Sold = next;
            }
        }
    }

    serialize() {
        const st = strToEnum('ShopTypes', this.ShopType) >= 0 ? strToEnum('ShopTypes', this.ShopType) : 0;
        const out = {
            Name: this.Name,
            Level: this.Level,
            CityLevel: this.CityLevel,
            PlayerLevel: this.PlayerLevel,
            Reputation: this.Reputation,
            Gold: scaleGold(this.Gold),
            Time: this.Time,
            ArcaneChance: scalePercent(this.ArcaneChance),
            ShopType: st,
        };
        if (this.Seed != null) out.Seed = this.Seed;
        if (this.GenLevel != null) out.GenLevel = this.GenLevel;
        if (this.GenCityLevel != null) out.GenCityLevel = this.GenCityLevel;
        if (this.GenPlayerLevel != null) out.GenPlayerLevel = this.GenPlayerLevel;
        if (this.GenShopType != null) out.GenShopType = strToEnum('ShopTypes', this.GenShopType) >= 0 ? strToEnum('ShopTypes', this.GenShopType) : st;
        out.UserAdditions = this.serializeUserAdditions();
        out.Sold = this.Sold && this.Sold.length ? this.Sold : [];
        return out;
    }

    /** Persist sold generated items: [fileCode, id, numberSold, bonus?]. */
    serializeSold() {
        return Array.isArray(this.Sold) ? this.Sold : [];
    }

    /** Minimal persistence format for user-added items only. [0, fileCode, id, n, c?, b?] or [1, name, typeEnum, costScaled, qty]. */
    serializeUserAdditions() {
        const list = [];
        for (const entry of this.Stock) {
            if (entry.isCustom) {
                const typeEnum = strToEnum('CustomItemTypes', entry.ItemType ?? 'Good') >= 0 ? strToEnum('CustomItemTypes', entry.ItemType ?? 'Good') : 0;
                list.push([1, entry.Name ?? 'Custom', typeEnum, scaleGold(typeof entry.Cost === 'number' ? entry.Cost : parseFloat(entry.Cost) || 0), Math.max(1, (entry.Number | 0) || 1)]);
            } else if (entry.userAdded && (entry.fileCode != null && entry.id != null)) {
                const row = [0, entry.fileCode, entry.id, Math.max(1, (entry.Number | 0) || 1)];
                if (entry.CostOverride != null) row.push(scaleGold(entry.CostOverride));
                if (entry.Bonus != null) row.push(entry.Bonus);
                list.push(row);
            } else if (entry.userAdded && entry.link) {
                const ref = getShareFileCodeAndId(entry.link);
                if (ref) {
                    const row = [0, ref.fileCode, ref.id, Math.max(1, (entry.Number | 0) || 1)];
                    if (entry.CostOverride != null) row.push(scaleGold(entry.CostOverride));
                    if (entry.Bonus != null) row.push(entry.Bonus);
                    list.push(row);
                }
            }
        }
        return list;
    }
}

export default Shop;
