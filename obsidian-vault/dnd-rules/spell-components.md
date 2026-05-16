# Spell Components

> What each component is, what prevents it, and the suffix conventions in spell lists.

## The six component types

### Verbal (V)

- The caster must **speak aloud**, in a measured tone audible within ~9 m.
- Cannot be supplied by:
  - *Silence* spell or magical silence in the casting area.
  - Gag, paralysis preventing speech, magical muteness.
  - Being deafened: **20% chance** the cast fails on each V-component spell (rolled per cast).
- Whispering counts as inaudible — no help.
- Casting a V-component spell is a **single sustained vocalization**; speech mid-cast (talking to allies, ordering a familiar) cannot replace or accompany it.

### Somatic (S)

- A measured **hand gesture**, requiring at least **one free hand** with full mobility.
- Cannot be supplied by:
  - Both hands occupied (two-weapon combat, holding two heavy items, climbing with both hands).
  - Grappled or pinned status.
  - Hand restrained (manacled, *hold person*, paralyzed).
- A wielded shield/weapon counts as occupying that hand unless dropped or otherwise freed.
- Wearing armor / using a shield while casting an arcane S-spell triggers **Arcane Spell Failure** (see [equipment.md](equipment.md)). Bards in light armor are exempt for bard spells.

### Material (M)

- A consumed physical substance (incense, sand, a feather, a snake's scale, etc.).
- The component is **expended** at casting (used up, even if the spell fails).
- A **spell-component pouch** is assumed to contain all standard non-trivial M components for free; the caster need not track them individually.
- **Costly material components** (those with a listed gp price, e.g. *raise dead*'s 5,000 gp diamond) are NOT in the pouch and **must be specifically purchased and tracked**.
- Without the required material component → cannot cast.

### Focus (F)

- A **physical implement** required for the cast but **not consumed** (e.g. tiny silver mirror for *scrying*, miniature platinum sword for *spiritual weapon*).
- Reusable across castings.
- Standard pouch contains all focuses without a listed cost.
- Costly focuses must be purchased and tracked.
- Without the focus → cannot cast.

### Divine focus (DF)

- A **holy symbol** (good cleric), **unholy symbol** (evil cleric), or specific natural object for druids/rangers (mistletoe or holly).
- Must be displayed/held during casting.
- Druids' DF is a sprig of mistletoe or holly (need not be held continuously — must be on the druid's person).
- Without the DF → cannot cast.

### Components combining "M/DF" or "F/DF"

- Spell components text like `Components: V, S, M/DF` means **arcane casters use M, divine casters use DF**.
- `F/DF` follows the same convention (focus for arcane, divine focus for divine).

### XP cost (XP)

- Some powerful spells (*wish*, *miracle*, *limited wish*, item creation) require the caster to **spend XP** at the moment of casting.
- XP spent **cannot be regained** by any means — not even *restoration* or *miracle*.
- The caster cannot spend so much XP that it would drop them below the minimum for their current level.
  - Equivalently: a caster at the minimum XP for their current level **cannot** cast a spell with an XP cost until they have earned enough to absorb the loss.
- A character may continue earning XP and casting the spell as soon as they have the XP to spare.
- XP is spent on **successful** casting (lost regardless if the spell fails after XP is committed).

## Spell list suffix codes

In spell lists (per class) and indices, a one-letter suffix on a spell name flags components that need extra attention:

| Suffix | Meaning |
|---|---|
| `m` | Costly material component (NOT in standard pouch — must be tracked). |
| `f` | Costly focus (NOT in standard pouch — must be tracked). |
| `x` | XP component (caster pays XP at cast time). |

- A spell may carry **multiple suffixes** if it has multiple costly components (e.g. `wishx` for *wish*).
- The full cost / item description appears in the individual spell's text under "Components."

## Practical implications

- A wizard restrained in manacles cannot cast S-component spells.
- A grappled caster cannot cast S-component spells; for V-only spells, must succeed on Concentration DC `10 + spell level`.
- A silenced caster (in *silence* effect, or gagged) cannot cast V-component spells.
- A deafened caster has **20% per-cast spell failure** on V-component spells (counts as casting from the cleric's perspective: slot is lost on failure).
- A caster without their spell-component pouch nor focus can still cast V-only spells, V+S spells, and any spell whose components they happen to possess. Wisdom/Int/Cha-keyed casters carry pouches by default unless circumstances prevent (stripped, robbed, …).

## Cross-references

- [magic.md](magic.md) — full spell description anatomy and casting procedure.
- [combat.md](combat.md) — Concentration checks for casting under stress; touch spells.
- [equipment.md](equipment.md) — Arcane Spell Failure for armored S-component arcane casts.
- [conditions.md](conditions.md) — silenced, grappled, paralyzed, deafened.
- [magic-items.md](magic-items.md) — costly XP/M components for scribing scrolls and crafting.

## Sources

- Manuale del Giocatore — pp. 175 (components V/S/M/F/DF/XP)
- Manuale del Giocatore — p. 183 (suffix codes m/f/x)
