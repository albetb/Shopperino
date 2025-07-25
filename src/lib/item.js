import { loadFile, weightedRandom } from './utils';

function itemQuality(shopLevel, partyLevel) {
    let major = 0, medium = 0, minor = 0;

    if (partyLevel === 10) {
        major = 1 + Math.sqrt(shopLevel);
    } else if (partyLevel > 10) {
        major = Math.min(5 * (partyLevel - 10) + Math.sqrt(shopLevel), 100);
    }

    if (partyLevel === 5) {
        medium = 1 + Math.pow(shopLevel, 0.75);
    } else if (partyLevel > 5) {
        medium = 5 * (partyLevel - 5) + Math.pow(shopLevel, 0.75);
    }
    medium = Math.min(medium, 100 - major);

    minor = Math.max(0, 100 - medium - major);

    const weights = [minor, medium, major];
    const qualityOptions = ['Minor', 'Medium', 'Major'];
    const selectedIndex = weightedRandom(weights);
    return qualityOptions[selectedIndex];
}

function newRandomItem(itemType, shopLevel, partyLevel, arcaneChance = 0.7, quality = null) {
    if (quality === null) {
        quality = itemQuality(shopLevel, partyLevel);
    }

    const itemGenerators = {
        'Good': () => newGood(),
        'Ammo': () => newAmmo(),
        'Weapon': () => newWeapon(shopLevel, partyLevel),
        'Armor': () => newArmor(shopLevel, partyLevel),
        'Shield': () => newShield(shopLevel, partyLevel),
        'Magic Weapon': () => newMagicWeapon(shopLevel, quality),
        'Magic Armor': () => newMagicArmor(shopLevel, quality),
        'Potion': () => newPotion(shopLevel, quality),
        'Ring': () => newRing(shopLevel, quality),
        'Rod': () => newRod(shopLevel, quality),
        'Staff': () => newStaff(shopLevel, quality),
        'Wand': () => newWand(shopLevel, quality),
        'Wondrous Item': () => newWondrous(shopLevel, quality),
        'Scroll': () => newScroll(shopLevel, quality, arcaneChance)
    };

    return itemGenerators[itemType]();
}

function randomMagicItem(shopLevel, partyLevel, quality = null) {
    quality = quality ?? itemQuality(shopLevel, partyLevel);
    const itemTable = itemChoice('Random Magic Item Chance', {
        quality: quality,
        file: 'tables'
    });
    const itemTypeName = itemTable.Name;

    return newRandomItem(itemTypeName, shopLevel, partyLevel, quality);
}

function getItem(itemName, itemType) {
    var itemList = [];
    if (itemType === 'Scroll') {
        const arcaneScroll = loadFile('scrolls')['Arcane'];
        const divineScroll = loadFile('scrolls')['Divine'];

        itemList = [...arcaneScroll, ...divineScroll];
    } else {
        itemList = loadFile('items')[itemType] ?? [];
    }

    const items = itemList
        .filter(item => item?.Name?.toLowerCase().includes(itemName.toLowerCase()))
        .map(item => removeUnusedAttributes(item));
    items.forEach(item => item.ItemType = itemType);

    return items;
}

function itemChoice(name, val = {}) {
    try {
        const table = loadFile(val.file ?? 'items')[name];
        const weights = table.map(item => item[val.quality ?? 'Chance'] + (val.mod ?? 0) * (item[val.quality ?? 'Chance'] > 0));
        const chosenItem = table[weightedRandom(weights)];

        return removeUnusedAttributes(chosenItem);
    } catch (error) {
        return null;
    }
}

function removeUnusedAttributes(item) {
    const cleanItem = { ...item };
    ['Minor', 'Medium', 'Major', 'Chance', 'Id'].forEach(key => {
        if (item && key in item) {
            delete cleanItem[key];
        }
    });
    return cleanItem;
}

function newGood() {
    return itemChoice('Good');
}

function newAmmo() {
    return itemChoice('Ammo');
}

function newWeapon(shopLevel, partyLevel) {
    const weapon = itemChoice('Weapon', { mod: shopLevel });
    const perfectChance = Math.min((shopLevel + Math.sqrt(partyLevel)) / 10, 1);
    if (Math.random() < perfectChance) {
        weapon.Name += ', perfect';
        weapon.Cost += 300;
    }
    return weapon;
}

function newArmor(shopLevel, partyLevel) {
    const armor = itemChoice('Armor', { mod: Math.sqrt(shopLevel) });
    const perfectChance = Math.min((shopLevel + Math.sqrt(partyLevel)) / 10, 1);
    if (Math.random() < perfectChance) {
        armor.Name += ', perfect';
        armor.Cost += 300;
    }
    return armor;
}

function newShield(shopLevel, partyLevel) {
    const shield = itemChoice('Shield', { mod: Math.sqrt(shopLevel) });
    const perfectChance = Math.min((shopLevel + Math.sqrt(partyLevel)) / 10, 1);
    if (Math.random() < perfectChance) {
        shield.Name += ', perfect';
        shield.Cost += 300;
    }
    return shield;
}

function newPotion(shopLevel, quality) {
    return itemChoice('Potion', { quality: quality, mod: shopLevel });
}

function newRing(shopLevel, quality) {
    return itemChoice('Ring', { quality: quality, mod: shopLevel });
}

function newRod(shopLevel, quality) {
    if (quality === 'Minor') return null;
    return itemChoice('Rod', { quality: quality, mod: shopLevel });
}

function newStaff(shopLevel, quality) {
    if (quality === 'Minor') return null;
    return itemChoice('Staff', { quality: quality, mod: shopLevel });
}

function newWand(shopLevel, quality) {
    return itemChoice('Wand', { quality: quality, mod: shopLevel });
}

function newWondrous(shopLevel, quality) {
    const id = Math.min(100, Math.floor(Math.random() * (1.5 * shopLevel)) + Math.ceil(Math.random() * 100));
    const itemsData = (loadFile('items'))['Wondrous Item'];
    const item = itemsData.find(x => x.Id === id && x.Type === quality);
    if (item) {
        return removeUnusedAttributes(item);
    }
    return null;
}

function newScroll(shopLevel, quality, arcaneChance = 0.7) {
    arcaneChance = Math.max(Math.min(arcaneChance, 1), 0);
    const divineChance = 1 - arcaneChance;
    const scrollType = ['Arcane', 'Divine'][weightedRandom([arcaneChance, divineChance])];
    const level = itemChoice('Scroll Level', { quality: quality, mod: Math.sqrt(shopLevel), file: 'tables' });
    const scrollsData = (loadFile('scrolls'))[scrollType];
    const scrolls = scrollsData?.filter(x => x.Level === level.Level);
    if (!scrolls) return null;
    const selectedScroll = weightedRandom(scrolls.map(x => x.Chance));
    const scroll = removeUnusedAttributes(scrolls[selectedScroll]);
    return scroll;
}

function newMagicWeapon(shopLevel, quality) {
    const specificWeaponChance = {
        'Minor': 0.05,
        'Medium': 0.06,
        'Major': 0.14
    };

    if (Math.random() <= specificWeaponChance[quality]) {
        return itemChoice('Specific Weapon', { quality: quality, file: 'items' });
    }

    let weapon = itemChoice('Weapon', { mod: shopLevel });
    const baseBonus = (itemChoice('Magic Weapon Base', { quality: quality, mod: Math.sqrt(shopLevel), file: 'tables' })).Name;
    let bonus = parseInt(baseBonus);

    const specialAbilityChance = {
        'Minor': 0.1,
        'Medium': 0.32,
        'Major': 0.37
    };
    let chance = specialAbilityChance[quality] + Math.max((Math.sqrt(shopLevel) - 1) / 100, 0);

    if (Math.random() <= chance) {
        let weaponType = 'Magic Melee Weapon';
        if (weapon.Subtype.includes('Ranged')) {
            weaponType = 'Magic Ranged Weapon';
        }

        let abilityList = [];
        let rolls = 1;
        while (rolls > 0) {
            rolls--;

            const doubleAbilityChance = {
                'Minor': 0.01,
                'Medium': 0.05,
                'Major': 0.1
            };
            chance = doubleAbilityChance[quality];

            if (Math.random() <= chance) {
                rolls += 2;
                continue;
            }

            let specialAbility = itemChoice(weaponType, { quality: quality, file: 'tables' });

            if (abilityList.some(item => item.Name === specialAbility.Name)) {
                rolls++;
                continue;
            }

            if (specialAbility['Cost Modifier'] < 6) {
                if (bonus + specialAbility['Cost Modifier'] > 10) {
                    rolls++;
                    continue;
                }
                bonus += specialAbility['Cost Modifier'];
            }

            weapon.Name += `, ${specialAbility.Name}`;
            abilityList.push(specialAbility);

            if (bonus >= 10) {
                break;
            }
        }

        weapon.Ability = abilityList;
    }

    weapon.Bonus = baseBonus;
    weapon.Name = `${weapon.Name} +${baseBonus}`;

    if (weapon.Ability && weapon.Ability.length > 0) {
        weapon.Link = [weapon.Link, ...weapon.Ability.flatMap(item => item.Link)];
    }

    weapon.Cost += 300 + 2000 * bonus ** 2;

    return weapon;
}

function newMagicArmor(shopLevel, quality) {
    const specificItemChance = {
        'Minor': 0.04,
        'Medium': 0.06,
        'Major': 0.06
    };

    if (Math.random() <= specificItemChance[quality]) {
        const itemType = Math.random() < 0.5 ? 'Armor' : 'Shield';
        return itemChoice(`Specific ${itemType}`, { quality: quality, mod: Math.sqrt(shopLevel), file: 'items' });
    }

    const bonusName = (itemChoice('Magic Armor Base', { quality: quality, mod: Math.sqrt(shopLevel), file: 'tables' })).Name;
    const baseBonus = parseInt(bonusName[1]);
    let bonus = parseInt(baseBonus);
    const isArmor = bonusName.toLowerCase().includes('armor');

    let armor;
    if (isArmor) {
        armor = (itemChoice('Armor', { mod: Math.sqrt(shopLevel) }));
    } else {
        armor = (itemChoice('Shield', { mod: Math.sqrt(shopLevel) }));
    }

    const specialAbilityChance = {
        'Minor': 0.09,
        'Medium': 0.37,
        'Major': 0.37
    };
    let chance = specialAbilityChance[quality] + Math.max((Math.sqrt(shopLevel) - 1) / 100, 0);

    if (Math.random() <= chance) {
        const itemType = isArmor ? 'Magic Armor' : 'Magic Shield';

        const abilityList = [];
        let rolls = 1;
        while (rolls > 0) {
            rolls--;

            const doubleAbilityChance = {
                'Minor': 0.01,
                'Medium': 0.05,
                'Major': 0.1
            };
            chance = doubleAbilityChance[quality];

            if (Math.random() <= chance) {
                rolls += 2;
                continue;
            }

            const specialAbility = itemChoice(itemType, { quality: quality, file: 'tables' });
            const mod = specialAbility['Cost Modifier'];

            const trimmedName = specialAbility.Name.slice(0, 5);
            if (abilityList.some(item => item.Name.slice(0, 5) === trimmedName)) {
                const present = abilityList.find(item => item.Name.slice(0, 5) === trimmedName);

                if (mod && typeof mod === 'number' && present['Cost Modifier'] < mod) {
                    if (mod < 6) {
                        if (bonus + mod > 10) {
                            rolls++;
                            continue;
                        }
                        bonus += mod - present['Cost Modifier'];
                    } else {
                        armor.Cost += mod - present['Cost Modifier'];
                    }

                    armor.Name = armor.Name.replace(present.Name, specialAbility.Name);
                    abilityList.splice(abilityList.indexOf(present), 1, specialAbility);
                    continue;
                } else {
                    rolls++;
                }
                continue;
            }

            if (mod && typeof mod === 'number') {
                if (mod < 6) {
                    if (bonus + mod > 10) {
                        rolls++;
                        continue;
                    }
                    bonus += mod;
                } else {
                    armor.Cost += mod;
                }
            }

            armor.Name += `, ${specialAbility.Name}`;
            abilityList.push(specialAbility);

            if (bonus >= 10) {
                break;
            }
        }

        armor.Ability = abilityList;
    }

    armor.Bonus = baseBonus;
    armor.Name = `${armor.Name} +${baseBonus}`;

    if (armor.Ability && armor.Ability.length > 0) {
        armor.Link = [armor.Link, ...armor.Ability.flatMap(item => item.Link)];
    }

    armor.Cost += 300 + 2000 * bonus ** 2;

    return armor;
}

export { newRandomItem, randomMagicItem, getItem, newWeapon, newArmor, newShield };
