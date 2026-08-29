/* The six ability scores of a bonded creature, laid out exactly as the monster
   sheet lays out a monster's — same grid, same labels-above-scores split — so a
   master reading a companion and a monster reads the two the same way.

   A creature may genuinely lack a score (an animal with no Intelligence entry,
   a construct with no Constitution); the model answers null for those and the
   cell shows an em dash rather than a misleading 10. */

import '../../style/creature_abilities.css';

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_LABELS = { str: 'Str', dex: 'Dex', con: 'Con', int: 'Int', wis: 'Wis', cha: 'Cha' };
const fmt = (n) => `${n >= 0 ? '+' : ''}${n}`;

/**
 * @param {{getAbilities: () => object, getAbilityMod: (key: string) => number|null}} creature
 */
export default function CreatureAbilities({ creature }) {
  const scores = creature?.getAbilities?.();
  if (!scores) return null;
  return (
    <div className="creature-abilities">
      <div className="ability-grid ability-grid-labels">
        {ABILITY_KEYS.map((key) => (
          <div key={key} className="ability-grid-cell ability-label-cell">
            {ABILITY_LABELS[key]}
          </div>
        ))}
      </div>
      <div className="ability-grid ability-grid-scores">
        {ABILITY_KEYS.map((key) => {
          const mod = creature.getAbilityMod(key);
          return (
            <div key={key} className="ability-grid-cell ability-score-cell">
              <div>{scores[key] ?? '—'}</div>
              <div className="ability-modifier">{mod == null ? '—' : fmt(mod)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
