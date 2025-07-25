import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import World from './world';
import City from './city';
import Shop from './shop';
import Spellbook from './spellbook';
import Loot from './loot';

const CURRENT_STORAGE_VERSION = 250716; // last modified date as yymmdd

//#region get

//#region Shopper

export function getWorlds() {
    const value = localStorage.getItem('Worlds');
    return value ? JSON.parse(decompressFromUTF16(value)) : [];
}

export function getSelectedWorld() {
    const value = localStorage.getItem('SelectedWorld');
    return value ? JSON.parse(decompressFromUTF16(value)) : { Id: null, Name: null };
}

export function getWorld(id) {
    const value = localStorage.getItem(`World/${id}`);
    return value ? new World().load(JSON.parse(decompressFromUTF16(value))) : null;
}

export function getCity(id) {
    const value = localStorage.getItem(`City/${id}`);
    return value ? new City().load(JSON.parse(decompressFromUTF16(value))) : null;
}

export function getShop(id) {
    const value = localStorage.getItem(`Shop/${id}`);
    return value ? new Shop().load(JSON.parse(decompressFromUTF16(value))) : null;
}

export function getIsWorldCollapsed() {
    const value = localStorage.getItem('IsWorldCollapsed');
    return value ? JSON.parse(decompressFromUTF16(value)) : false;
}

export function getIsCityCollapsed() {
    const value = localStorage.getItem('IsCityCollapsed');
    return value ? JSON.parse(decompressFromUTF16(value)) : false;
}

export function getIsShopCollapsed() {
    const value = localStorage.getItem('IsShopCollapsed');
    return value ? JSON.parse(decompressFromUTF16(value)) : false;
}

export function getCurrentTab() {
    const value = localStorage.getItem('CurrentTab');
    return value ? JSON.parse(decompressFromUTF16(value)) : 0;
}

//#endregion

//#region Spellbook

export function getSpellbooks() {
    const value = localStorage.getItem('Spellbooks');
    return value ? JSON.parse(decompressFromUTF16(value)) : [];
}

export function getSpellbook(id) {
    const value = localStorage.getItem(`Spellbook/${id}`);
    return value ? new Spellbook().load(JSON.parse(decompressFromUTF16(value))) : null;
}

export function getSelectedSpellbook() {
    const value = localStorage.getItem('SelectedSpellbook');
    return value ? JSON.parse(decompressFromUTF16(value)) : { Id: null, Name: null };
}

export function getIsPlayerCollapsed() {
    const value = localStorage.getItem('IsPlayerCollapsed');
    return value ? JSON.parse(decompressFromUTF16(value)) : false;
}

export function getIsSearchCollapsed() {
    const value = localStorage.getItem('IsSearchCollapsed');
    return value ? JSON.parse(decompressFromUTF16(value)) : false;
}

export function getIsSpellTableCollapsed() {
    const value = localStorage.getItem('IsSpellTableCollapsed');
    return value ? JSON.parse(decompressFromUTF16(value)) : [false, false, false, false, false, false, false, false, false, false];
}

export function getIsSpellbookSidebarCollapsed() {
    const value = localStorage.getItem('IsSpellbookSidebarCollapsed');
    return value ? JSON.parse(decompressFromUTF16(value)) : false;
}

export function getSpellbookPage() {
    const value = localStorage.getItem('SpellbookPage');
    return value ? JSON.parse(decompressFromUTF16(value)) : 0;
}

export function getIsClassDescriptionCollapsed() {
    const value = localStorage.getItem('IsClassDescriptionCollapsed');
    return value ? JSON.parse(decompressFromUTF16(value)) : false;
}

export function getIsDomainDescriptionCollapsed() {
    const value = localStorage.getItem('IsDomainDescriptionCollapsed');
    return value ? JSON.parse(decompressFromUTF16(value)) : false;
}

export function getSearchSpellName() {
    const value = localStorage.getItem('SearchSpellName');
    return value ? JSON.parse(decompressFromUTF16(value)) : "";
}

export function getSearchSpellSchool() {
    const value = localStorage.getItem('SearchSpellSchool');
    return value ? JSON.parse(decompressFromUTF16(value)) : "";
}

//#endregion

//#region Loot

export function getLoots() {
    const value = localStorage.getItem('Loots');
    return value ? JSON.parse(decompressFromUTF16(value)) : [];
}

export function getLoot(id) {
    const value = localStorage.getItem(`Loot/${id}`);
    return value ? new Loot().load(JSON.parse(decompressFromUTF16(value))) : null;
}

export function getSelectedLoot() {
    const value = localStorage.getItem('SelectedLoot');
    return value ? JSON.parse(decompressFromUTF16(value)) : { Id: null, Name: null };
}

export function getIsLootSidebarCollapsed() {
    const value = localStorage.getItem('IsLootSidebarCollapsed');
    return value ? JSON.parse(decompressFromUTF16(value)) : false;
}

export function getIsLootCollapsed() {
    const value = localStorage.getItem('IsLootCollapsed');
    return value ? JSON.parse(decompressFromUTF16(value)) : false;
}

//#endregion

//#endregion

//#region set

//#region Shopper

export function setWorlds(value) {
    localStorage.setItem('Worlds', compressToUTF16(JSON.stringify(value)));
}

export function setSelectedWorld(value) {
    localStorage.setItem('SelectedWorld', compressToUTF16(JSON.stringify(value)));
}

export function setWorld(value) {
    if (value?.Id)
        localStorage.setItem(`World/${value.Id}`, compressToUTF16(JSON.stringify(value)));
}

export function setCity(value) {
    if (value?.Id)
        localStorage.setItem(`City/${value.Id}`, compressToUTF16(JSON.stringify(value)));
}

export function setShop(value) {
    if (value?.Id)
        localStorage.setItem(`Shop/${value.Id}`, compressToUTF16(JSON.stringify(value)));
}

export function setIsWorldCollapsed(value) {
    localStorage.setItem('IsWorldCollapsed', compressToUTF16(JSON.stringify(value)));
}

export function setIsCityCollapsed(value) {
    localStorage.setItem('IsCityCollapsed', compressToUTF16(JSON.stringify(value)));
}

export function setIsShopCollapsed(value) {
    localStorage.setItem('IsShopCollapsed', compressToUTF16(JSON.stringify(value)));
}

export function setCurrentTab(value) {
    localStorage.setItem('CurrentTab', compressToUTF16(JSON.stringify(value)));
}

//#endregion

//#region Spellbook

export function setSpellbooks(value) {
    localStorage.setItem('Spellbooks', compressToUTF16(JSON.stringify(value)));
}

export function setSpellbook(value) {
    if (value?.Id)
        localStorage.setItem(`Spellbook/${value.Id}`, compressToUTF16(JSON.stringify(value)));
}

export function setSelectedSpellbook(value) {
    localStorage.setItem('SelectedSpellbook', compressToUTF16(JSON.stringify(value)));
}

export function setIsPlayerCollapsed(value) {
    localStorage.setItem('IsPlayerCollapsed', compressToUTF16(JSON.stringify(value)));
}

export function setIsSearchCollapsed(value) {
    localStorage.setItem('IsSearchCollapsed', compressToUTF16(JSON.stringify(value)));
}

export function setIsSpellTableCollapsed(value) {
    localStorage.setItem('IsSpellTableCollapsed', compressToUTF16(JSON.stringify(value)));
}

export function setIsSpellbookSidebarCollapsed(value) {
    localStorage.setItem('IsSpellbookSidebarCollapsed', compressToUTF16(JSON.stringify(value)));
}

export function setSpellbookPage(value) {
    localStorage.setItem('SpellbookPage', compressToUTF16(JSON.stringify(value)));
}

export function setIsClassDescriptionCollapsed(value) {
    localStorage.setItem('IsClassDescriptionCollapsed', compressToUTF16(JSON.stringify(value)));
}

export function setIsDomainDescriptionCollapsed(value) {
    localStorage.setItem('IsDomainDescriptionCollapsed', compressToUTF16(JSON.stringify(value)));
}

export function setSearchSpellName(value) {
    localStorage.setItem('SearchSpellName', compressToUTF16(JSON.stringify(value)));
}

export function setSearchSpellSchool(value) {
    localStorage.setItem('SearchSpellSchool', compressToUTF16(JSON.stringify(value)));
}

//#endregion

//#region Loot

export function setLoots(value) {
    localStorage.setItem('Loots', compressToUTF16(JSON.stringify(value)));
}

export function setLoot(value) {
    if (value?.Id)
        localStorage.setItem(`Loot/${value.Id}`, compressToUTF16(JSON.stringify(value)));
}

export function setSelectedLoot(value) {
    localStorage.setItem('SelectedLoot', compressToUTF16(JSON.stringify(value)));
}

export function setIsLootSidebarCollapsed(value) {
    localStorage.setItem('IsLootSidebarCollapsed', compressToUTF16(JSON.stringify(value)));
}

export function setIsLootCollapsed(value) {
    localStorage.setItem('IsLootCollapsed', compressToUTF16(JSON.stringify(value)));
}

//#endregion

//#endregion

//#region delete

export function deleteWorld(value) {
    localStorage.removeItem(`World/${value}`);
}

export function deleteCity(value) {
    localStorage.removeItem(`City/${value}`);
}

export function deleteShop(value) {
    localStorage.removeItem(`Shop/${value}`);
}

export function deleteSpellbook(value) {
    localStorage.removeItem(`Spellbook/${value}`);
}

export function deleteLoot(value) {
    localStorage.removeItem(`Loot/${value}`);
}

export function validateDb() {
    try {
        const version = parseInt(JSON.parse(decompressFromUTF16(localStorage.getItem('Version')) ?? 0));
        if (!version || version < CURRENT_STORAGE_VERSION) {
            throw new Error();
        }
    }
    catch {
        localStorage.clear();
        localStorage.setItem('Version', compressToUTF16(JSON.stringify(CURRENT_STORAGE_VERSION)))
    }
}

//#endregion

//#region save storage

const getAllLocalStorageItems = () => {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const compressedValue = localStorage.getItem(key);
        if (compressedValue) {
            items[key] = decompressFromUTF16(compressedValue);
        }
    }
    return JSON.stringify(items, null, 2);
};

export const downloadLocalStorage = () => {
    const data = getAllLocalStorageItems();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ShopperinoStorageData.json';
    a.click();
    URL.revokeObjectURL(url);
};

export const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            localStorage.clear();
            for (const key in data) {
                localStorage.setItem(key, compressToUTF16(data[key]));
            }
            window.location.reload();
        } catch (error) { }
    };

    reader.readAsText(file);
};

//#endregion
