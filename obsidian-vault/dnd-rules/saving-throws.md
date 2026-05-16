# Saving Throws

> Fortitude / Reflex / Will resolution, ability mapping, save DCs.

## Core mechanic

`save total = d20 + base save (class+level) + ability mod + misc`

- Compare to the effect's **save DC**. Total ≥ DC = success.
- Success effect varies per ability: negate, halve damage (Reflex), partially resist, or shorten duration.

## The three saves

| Save | Ability | Resists |
|------|---------|---------|
| Fortitude | Constitution | poison, disease, petrification, energy drain, *disintegrate*, raw physical effects on the body |
| Reflex | Dexterity | area effects, falling, dragon breath, *fireball*, traps, dodgeable harm |
| Will | Wisdom | *charm*, compulsion, illusion, most enchantment, mind-affecting effects |

Base save progression by class level is in [classes.md](classes.md). Multiclass: sum the base save fractions per class (each class gives its own base value at the class's level — they add together).

## Save DC formulas

- **Spell save DC** = `10 + spell level + casting ability mod` (Int for wizard, Wis for cleric/druid, Cha for sorcerer/bard, etc.).
- **Special ability save DC** = `10 + ½ HD + relevant ability mod` (creature-specific; usually Cha or Con).
- **Item / trap save DC**: per item or trap description.

## Auto fail / auto succeed

- Natural 1 on the d20 → always **fails**, regardless of total. May also damage carried items (see source for object-save rules).
- Natural 20 on the d20 → always **succeeds**, regardless of total.

## Effect categories

- **Negates**: success means the effect doesn't happen at all.
- **Partial**: success reduces severity (e.g. petrification → slowed for a round).
- **Half**: success deals half damage (most area damaging spells, Reflex).
- **Disbelief**: Will save to recognize an illusion as fake; success lets the saver perceive the illusion's true nature (still see it, but with translucency).

## Cross-references

- [combat.md](combat.md) — when saves trigger in combat.
- [magic.md](magic.md) — which spells call for which save.
- [classes.md](classes.md) — base save progressions (good vs poor save tables).
- [ability-scores.md](ability-scores.md) — how Con/Dex/Wis modifiers are derived.

## Sources

- Manuale del Giocatore — pp. 135–136
