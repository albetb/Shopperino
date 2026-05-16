---
name: dnd-rules-extract
description: Extract condensed D&D 3.5 rule notes from a PDF manual (player's handbook, DMG, monster manual, supplements — Italian or English) and merge them into topic-organized markdown files in `obsidian-vault/dnd-rules/`. Trigger whenever the user gives a manual page range to summarize for the Shopperino app's rules knowledge base — e.g. "extract rules from pages 12-30 of <pdf>", "estrai regole dalle pagine X-Y di <manuale>", "/dnd-rules-extract <pdf> <range>", "summarize D&D rules from <pdf> pages X-Y into obsidian-vault/dnd-rules", "process pages X-Y of the Manuale del Giocatore for the rules vault", or anything that mentions a D&D 3.5 PDF + a page range with the intent of building rule notes. Use this skill (not a plain Read + Write) whenever the goal is to populate the Shopperino rules knowledge base, even if the user does not say the word "skill" or "extract" explicitly. Do NOT trigger for: reading a PDF without writing rule notes, reading non-D&D PDFs, or pure code/UI work that just happens to reference D&D concepts.
---

# D&D 3.5 Rules Extractor

## Purpose

This skill builds a long-lived markdown knowledge base of D&D 3.5 rules at [obsidian-vault/dnd-rules/](../../../obsidian-vault/dnd-rules/). The notes are consumed by Claude in future sessions of the Shopperino project so the assistant can implement features in line with the rules without the user re-explaining them every time.

**Optimize the output for that consumer (Claude reading the notes later), not for a human reader.** That means: short, dense, scannable, no flavor text, no marketing, no redundant phrasing. Every line should carry a mechanic, formula, relationship, or exception.

## Inputs

The user provides:
1. **PDF path** — any D&D 3.5 manual (Manuale del Giocatore, Guida del DM, Manuale dei Mostri, supplements, English or Italian).
2. **Page range** — e.g. `5-7`, `120-135`, or a single page `42`.

If either is missing or ambiguous, ask once and proceed.

## Workflow

### 1. Read the pages

Use the `Read` tool with the `pages` parameter (poppler is installed system-wide; this works directly). The PDF reader returns either text or rendered page images depending on the file.

**Fallback if Read fails** (rare — happens if PDF text extraction breaks or the file is too large):
```bash
"/c/Users/albet/AppData/Local/Microsoft/WinGet/Packages/oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe/poppler-25.07.0/Library/bin/pdftotext.exe" -f <first> -l <last> -layout "<pdf path>" "<temp .txt>"
```
Then `Read` the temp file and delete it when done.

If `pages` exceeds 20 in one call, split into chunks of ≤20 and process sequentially — the Read tool refuses larger spans.

### 2. Identify topics

Read the extracted pages and identify which D&D rule topics appear. A "topic" is a coherent slice of the rules system — see [references/topic-taxonomy.md](references/topic-taxonomy.md) for the canonical list and naming convention. Use existing topic names when content fits; only invent a new topic when no existing one applies.

A single page can contribute to multiple topics. A single topic can span many pages across many invocations — that's the whole point of merging.

### 3. For each topic, merge or create

Target folder: `obsidian-vault/dnd-rules/`

- If `<topic>.md` exists in the folder → **merge**: integrate new mechanics, reconcile contradictions (favor the more specific or more recent source; flag genuine contradictions inline with `<!-- CONFLICT: ... -->`), avoid duplicating information already present. Update or extend existing sections rather than appending an unconnected new section.
- If `<topic>.md` does not exist → **create** it using the structure in the "File Format" section below.

**Legacy files:** ignore any pre-existing file in `obsidian-vault/dnd-rules/` that does not match the `<topic>.md` lowercase-hyphenated naming convention (e.g. the older `manuale-giocatore-pp5-7-introduzione.md`). Do not delete it — leave it for the user to remove manually.

### 4. Update the source footer

At the bottom of each modified file, maintain a `## Sources` section listing every manual + page range that has contributed. One bullet per extraction. If the same manual + same pages already appear, do not re-add the entry.

## Content rules (strict)

These rules are the heart of the skill — follow them or the notes become useless bloat.

### Language
Write notes in **English** even if the source PDF is Italian. Translate D&D terms to their standard English equivalents:

| Italian | English |
|---|---|
| Forza, Destrezza, Costituzione, Intelligenza, Saggezza, Carisma | Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma |
| Tiro salvezza (Tempra, Riflessi, Volontà) | Saving throw (Fortitude, Reflex, Will) |
| Classe Armatura (CA) | Armor Class (AC) |
| Classe Difficoltà (CD) | Difficulty Class (DC) |
| Punti ferita (pf) | Hit points (HP) |
| Tiro per colpire / Bonus di attacco base | Attack roll / Base Attack Bonus (BAB) |
| Prova di abilità / Grado | Skill check / Skill rank |
| Talento | Feat |
| Incantesimo / Slot / Componente | Spell / Slot / Component |
| Round / Azione standard / di movimento / di round completo | Round / Standard / Move / Full-round action |
| Colpo critico / Minaccia / Conferma | Critical hit / Threat / Confirmation |
| Allineamento | Alignment |
| Privilegio di classe | Class feature |
| Razza, Classe, Classe di prestigio | Race, Class, Prestige class |
| Resistenza agli incantesimi | Spell resistance (SR) |
| Attacco di opportunità | Attack of opportunity (AoO) |

Use the English term as primary; you may add the Italian term in parens once per file the first time a tricky translation appears, if disambiguation helps.

### What to capture
- **Mechanics**: how a rule resolves. "Reflex save = d20 + base Reflex + Dex mod vs DC."
- **Formulas**: any computation. "AC = 10 + armor bonus + shield bonus + Dex mod + size mod + natural armor + deflection + dodge + misc."
- **Relationships**: which stat drives which check; which class feature scales with what; what stacks and what doesn't.
- **Trigger conditions**: when a rule applies. "AoO triggers when a creature performs an action that provokes within a threatened square."
- **Edge cases and exceptions**: anything that an implementer will get wrong if they only read the happy path. "Some skills cannot be used untrained (see skill description)." "Natural 1 on a saving throw always fails regardless of total."
- **Stacking rules**: which bonuses stack and which don't (different named bonuses generally stack; same-named generally don't, take the higher; dodge and circumstance always stack with themselves).

### What NOT to capture
- **No enumerable lists.** Specific spells, feats, items, skills, classes, races, monsters are already in [src/data/](../../../src/data/) JSON files. Do not duplicate them. Describe the *system* (e.g. "feats have prerequisites that may be ability scores, BAB, other feats, class levels, or skill ranks") but not the *instances* ("Power Attack requires Str 13").
- **No numeric tables.** No "HP per class at 1st level" table, no "saving throw progression by class level," no "wealth by level," no spell-slot grids. Capture the *formula or rule* that generates the table.
  - ✅ "HP at 1st level = max die value + Con mod; on subsequent levels roll the class HD + Con mod (min 1)."
  - ❌ "Barbarian d12, Fighter d10, Cleric d8, …"
- **No marketing or flavor text.** Skip "30 years of fantasy roleplaying tradition" intros, sidebar anecdotes, in-world fiction.
- **No GM-only narrative advice** that doesn't translate to a mechanic. (Tips like "describe the scene vividly" are out; "the DM may grant a +2 circumstance bonus for clever roleplay" is in, because it's a mechanic.)

### Density target
Aim for ~1 line per rule. Bullet lists over prose. Tables only when a small symmetric relationship is genuinely clearer that way (e.g. "save → ability" mappings). Never re-explain something the reader can infer from a previous bullet in the same file.

## File format

Each topic file follows this skeleton (adapt headings as needed — these are minimums, not maximums):

```markdown
# <Topic Title>

> One-sentence scope: what this file covers.

## Core mechanic

<the central rule(s) of this topic, as bullets or short paragraphs>

## Formulas

<every derived value, written as `result = inputs`>

## Modifiers and stacking

<which bonuses apply, which stack>

## Edge cases & exceptions

<the gotchas an implementer must know>

## Cross-references

<bullets pointing to other topic files when a rule lives partly elsewhere — use relative links like `[combat.md](combat.md)`>

## Sources

- Manuale del Giocatore — pp. 5–7
- Guida del DM — pp. 40–42
```

The `Sources` section is append-only across invocations. Keep entries sorted by manual then page.

## Topic selection

When a page covers a topic for the first time, choose the canonical file name from [references/topic-taxonomy.md](references/topic-taxonomy.md). When in doubt:

- Split rather than lump if a topic is large enough to deserve its own file (e.g. `magic-spellcasting.md` separate from `magic-spell-resistance.md` once both grow substantial).
- Prefer existing files: if the page covers material that could fit into a file already present, extend that file instead of creating a near-duplicate one.
- Use lowercase-hyphenated names: `character-creation.md`, `combat.md`, `attacks-of-opportunity.md`.

## After extraction

1. Run a sanity pass on every file touched: did anything slip through that's a list of specific items, a numeric table, or flavor text? Trim it.
2. Report to the user, in 2-4 lines: which manual + pages were processed, which topic files were created vs updated, and any notable conflicts or gaps. Use clickable markdown links for the files.

## Examples

### Example 1
**User:** `extract rules from pages 5-7 of "C:\Users\albet\Downloads\Manuale Del Giocatore-1-150.pdf"`

**Skill behavior:** Reads pages 5-7. Identifies topics: *core-mechanic*, *dice*, *character-creation*, *combat* (round structure intro). Creates/updates `core-mechanic.md`, `dice.md`, `character-creation.md`, `combat.md`. Each file ends with a Sources entry like `Manuale del Giocatore — pp. 5–7`.

### Example 2
**User:** `estrai regole dalle pagine 134-142 del Manuale del Giocatore C:\Users\albet\Documents\D&D 3.5\!Manuali - Base\Manuale Del Giocatore.pdf`

**Skill behavior:** PDF likely covers combat mechanics (attacks of opportunity, critical hits, full-attack actions). Reads via Read tool; if the file exceeds 100MB, falls back to `pdftotext.exe` via Bash. Merges into existing `combat.md` and/or creates `attacks-of-opportunity.md` if substantial. Translates Italian terms (e.g. "minaccia un critico" → "threatens a critical hit").

### Example 3
**User:** `/dnd-rules-extract "C:\path\to\Manuale dei Mostri.pdf" 8-12`

**Skill behavior:** Different manual → different topics likely (monster types, subtypes, special attacks/qualities). Creates `monster-types.md`, `special-abilities.md` etc. The Sources entry uses "Manuale dei Mostri" as the manual name.
