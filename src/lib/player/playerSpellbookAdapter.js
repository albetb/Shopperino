/**
 * Build a plain object suitable for Spellbook.load() from a Player instance.
 * Used by player sheet spellbook hook and thunks.
 * @param {import('./player').default} player
 * @returns {Record<string, unknown> | null} Object for Spellbook.load() or null if no player.
 */
export function playerToSpellbookData(player) {
  if (!player || typeof player.getClass !== 'function') return null;
  const _class = player.getClass();
  const level = typeof player.getLevel === 'function' ? player.getLevel() : 1;
  let characteristic = 10;
  if (_class === 'Wizard') {
    characteristic = (player.getAbilityBase?.('int') ?? 10) + (player.getAbilityBonus?.('int') ?? 0);
  } else if (['Cleric', 'Druid', 'Ranger', 'Paladin'].includes(_class)) {
    characteristic = (player.getAbilityBase?.('wis') ?? 10) + (player.getAbilityBonus?.('wis') ?? 0);
  } else if (['Sorcerer', 'Bard'].includes(_class)) {
    characteristic = (player.getAbilityBase?.('cha') ?? 10) + (player.getAbilityBonus?.('cha') ?? 0);
  }
  const spells = Array.isArray(player.spells) ? player.spells : [];
  const usedDomainSpells = Array.isArray(player.usedDomainSpells) && player.usedDomainSpells.length >= 10
    ? player.usedDomainSpells.slice(0, 10)
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const preparedDomainSpells = player.preparedDomainSpells && typeof player.preparedDomainSpells === 'object'
    ? player.preparedDomainSpells
    : {};
  return {
    Name: typeof player.getName === 'function' ? player.getName() : '',
    Class: _class,
    Level: level,
    Characteristic: characteristic,
    Spells: spells,
    MoralAlignment: player.moralAlignment ?? 'Neutral',
    EthicalAlignment: player.ethicalAlignment ?? 'Neutral',
    Domain1: player.domain1 ?? '',
    Domain2: player.domain2 ?? '',
    UsedDomainSpells: usedDomainSpells,
    PreparedDomainSpells: preparedDomainSpells,
    Specialized: player.specialized ?? '',
    Forbidden1: player.forbidden1 ?? '',
    Forbidden2: player.forbidden2 ?? '',
  };
}
