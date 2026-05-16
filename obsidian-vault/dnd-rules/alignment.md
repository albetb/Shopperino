# Alignment

> The nine-alignment grid: what each is, how it matters mechanically, and how it interacts with classes and spells.

## The grid

Two independent axes, three values each → **9 alignments**:

|             | Good | Neutral | Evil |
|---|---|---|---|
| **Lawful**  | Lawful Good (LG) | Lawful Neutral (LN) | Lawful Evil (LE) |
| **Neutral** | Neutral Good (NG) | True Neutral (N)    | Neutral Evil (NE) |
| **Chaotic** | Chaotic Good (CG) | Chaotic Neutral (CN) | Chaotic Evil (CE) |

- **Law–Chaos axis**: respect for order, hierarchy, tradition, oaths versus personal freedom, adaptability, rejection of structure.
- **Good–Evil axis**: altruism, respect for life, willingness to sacrifice self versus selfishness, harming others for gain or pleasure.
- "**One step**" relationships: two alignments are within one step if they differ on **at most one axis** (e.g. LG and NG are one step apart; LG and CN are two steps; LG and CE are three).

## Mechanical role

Alignment is **primarily a roleplaying guide**, not a constant numeric input. It rarely modifies dice rolls. The places it does matter:

- **Class restrictions** — some classes require specific alignment(s); changing alignment can cost class abilities. Captured in [classes.md](classes.md), [class-features.md](class-features.md), and [multiclassing.md](multiclassing.md). Summary:
  - Paladin → **Lawful Good**; falling to non-LG → ex-paladin.
  - Monk → any **Lawful**; falling to non-lawful → ex-monk and one-way multiclass.
  - Druid → at least one axis **Neutral**.
  - Barbarian, Bard → any **non-lawful**.
  - Cleric → within **one step** of deity's alignment on both axes.
- **Alignment-tagged spells** — many spells have a `[Good]`, `[Evil]`, `[Lawful]`, or `[Chaotic]` descriptor. Casting a spell with a descriptor opposite to the caster's alignment has consequences (typically forbidden for the caster, or an alignment shift if used; for clerics, cannot cast spells with descriptors opposite to either of their or their deity's alignment components).
- **Detect/affect alignment spells** — *detect evil/good/law/chaos*, *protection from evil/good/law/chaos*, *holy word*, *unholy word*, *order's wrath*, *word of chaos*, *holy smite*, *unholy blight*, *dictum*, *cloak of chaos*, *holy aura*, *unholy aura*, *blasphemy*, *dispel evil/good/law/chaos*, etc. — target or affect creatures by alignment component.
- **Aura strength** — clerics and paladins, and other certain classes/creatures, project an alignment aura matching their deity (or alignment) at an intensity tied to class level; detectable by *detect alignment* spells.
- **Magic item restrictions** — some magic items have alignment requirements; non-matching wielders take penalties or cannot activate them. Use Magic Device can emulate an alignment ([skills-detail.md](skills-detail.md#utilizzare-oggetti-magici-use-magic-device)).
- **Smite-type abilities** — paladin smite evil and similar effects target by alignment component.
- **Turn/rebuke undead orientation** — alignment determines whether a cleric turns (good/neutral) or rebukes (evil) undead, plus deity-specific overrides ([class-features.md](class-features.md) → Turn / rebuke undead).

## Religion (cleric requirement)

- **Most characters** do not have to follow any deity. Religion is flavor.
- **Clerics** are the exception: a cleric must venerate either a specific deity or a strongly-held cause/principle.
  - With a deity: cleric's alignment must be within one step of deity's, and clerics' two chosen domains must come from the deity's allowed domain list.
  - Without a deity: cleric's two domains must be chosen from the alignment-tagged domains (Good, Evil, Law, Chaos) and must match the cleric's alignment.
- **Druids** venerate nature itself (no specific deity needed) but follow the druid alignment restriction.
- **Paladins** must follow a lawful good cause or LG deity, but no specific deity is required.
- Per-deity data (alignment, allowed domains, favored weapon, typical followers) lives in [src/data/classes.json](../../src/data/classes.json) (cleric/deity tables) — see also Table 3-7 noted in [class-features.md](class-features.md).

## Alignment shifts during play

- Alignment can change through accumulated action (DM judgement). A violent, willing shift can trigger class-feature loss (paladin, monk, druid, barbarian, bard, cleric) until *atonement* or natural realignment.
- A single act inconsistent with alignment does not change it; sustained behavior or a single grossly out-of-character act may.

## Cross-references

- [classes.md](classes.md) — class alignment restrictions per class.
- [class-features.md](class-features.md) — alignment-tied class features (paladin smite, cleric aura, turn/rebuke split).
- [multiclassing.md](multiclassing.md) — alignment shifts as ex-class triggers.
- [magic.md](magic.md) — spell descriptors and casting restrictions.
- [skills-detail.md](skills-detail.md) — Use Magic Device to emulate alignment.

## Sources

- Manuale del Giocatore — pp. 104–108 (summarized: user-provided synthesis rather than direct extraction)
