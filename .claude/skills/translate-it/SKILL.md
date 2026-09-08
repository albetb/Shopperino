---
name: translate-it
description: Translate the Shopperino app into another language — Italian today, any language the same way. Use whenever the user asks to translate part of the app, continue the translation, do the next batch, translate a component or a data file, add a language, or asks what is left to translate. Handles the glossary, the English source that must never be edited, and the verification that the game rules survived. Pass `continuous` to keep going without stopping after each session's worth.
---

# Translating Shopperino

English is what the app is written in. Every other language is a **pack** beside
it, chosen at run time. Translations need not match the Italian manuals — the
meaning and the mechanics must survive, and one English term always becomes the
same word.

Use **Sonnet or better**. Haiku's terminology is not reliable enough here.

## Where each kind of string goes

| Kind of string | Stays where it is | Translation goes to |
|---|---|---|
| A literal in a component | `t('Collapse')` in the JSX | `src/data/<lang>/ui.json` |
| A name that is also a key | English, in `src/data` | `src/data/<lang>/names.json` |
| Prose in `src/data` | English, untouched | `src/data/<lang>/<file>.json` |

**English never leaves and is never overwritten.** `t('X')` falls back to `X`,
so the key must be the English literal character for character.

---

## If you were given no instructions

`/translate-it` alone means: pick up where the work left off, do a session's
worth, stop and report.

1. Run `progress.py`.
2. **Pick the target.** If the user named a file or phase, that is the target.
   Otherwise take the first thing with work left, in phase order.
3. **Do a session's worth**, then stop:
   - data — **~180 strings**, or the file finishes;
   - UI — **~120 strings**, however many files that takes.

   Count strings, not files. Much of `common/` is one or two strings a file, so
   a file budget spends an hour on fourteen strings. Take small files in a run
   — read several, wrap them, add their strings to the pack in one pass.
4. **Report**: what you translated, the `progress.py` numbers, anything you left
   alone and why, and which files are ready to commit.

### Running continuously

If the invocation carries **`continuous`** (or `forever`, `keep going`), do not
stop after a session's worth. Loop: pick the next target, translate it, run the
checks, say what you did in **one line**, pick the next.

- No long report between cycles, and never ask whether to carry on.
- Every ~150 strings, run the full suite, `en_drift.py` and `verify.py`, and
  print the `progress.py` numbers as a checkpoint the user can commit.
- Stop only when the phase is finished, or when a gate fails twice on the same
  string, or when `progress.py` stops moving between cycles.

The user cannot have you commit; uncommitted work piling up is expected and
breaks nothing, because the gates compare `src/data` against `HEAD` and you
never write there.

### The three rules that are not yours to bend

- **Never edit a file in `src/data/` that is not inside a language folder.**
  If a gate complains, the fix goes in the pack.
- **Never edit `fields.json` to quieten a gate.**
- **You may ADD a term to `glossary.json`. You may never change one that is
  already there.**

If the same gate fails twice on the same string, stop and ask.

---

## The phases

**Phase 1 — the UI.** ~1,260 strings across ~150 components, plus display
strings in `src/lib`. **Start with `src/components/common/`.** A shared
component that builds a string around a prop — `aria-label={`How ${label}
works`}` — is handed an already-translated label by its callers, so until it is
translated every one of its 16 callers reads half in each language. Worse, a
test written against that state bakes the defect in as an assertion.

**Phase 2 — the data prose.** ~6,700 strings, in this order:
`tables.json` → `skills.json` → `feats.json` → `races.json` → `classes.json` →
`traps.json` → `items.json` → `spells.json` → `animals.json` → `vermin.json` →
`monsters.json`

**Phase 3 — the names.** Item, spell, feat, skill and monster names into
`names.json`, and the display sites that call `tName()`.

---

## Workflow A — a component

Do one file at a time. **Most components need no new test** — see step 12
before you write one; a test file to prove that a single string renders is the
main way this work goes slowly.

1. Read the component.
2. Wrap every string a person reads in `t('…')`: JSX text, `title`,
   `placeholder`, `aria-label`, `alt`, `label`, `eyebrow`, `hint`. **Leave the
   English in place** — it is the key and the fallback both.
   ```jsx
   -  aria-label={open ? 'Collapse' : 'Expand'}
   +  aria-label={open ? t('Collapse') : t('Expand')}
   ```
   `import { t } from '<...>/lib/i18n';` — the plain function, not a hook.
3. **Do not wrap**: `className`, `icon` names (`"add"`, `"expand_less"` —
   Material Symbols ligatures), CSS variables, `key`s, action types, or any
   string compared against data (`'Str'`, `'Simple Weapons'`, `'Neutral'`).
   If changing the string would change what the code *does*, it is a key.
4. **A sentence stays one string.** Use `tx()` with numbered holes; never glue
   fragments around a value. Keys like `t('of')` or `t('the reset')` freeze
   English word order into every other language.
   ```jsx
   -  {t('The book prints this as')} <b>{t('CR')} {trap.cr}</b>. {t('Its own tables add up to')} {cr}
   +  {tx('The book prints this as {0}. Its own tables add up to {1}', <b>{t('CR')} {trap.cr}</b>, cr)}
   ```
   `tx` returns a string when every value is text, so it works in a `title`.
5. **Check what the sentence interpolates.** A wrapped sentence still reads
   half-English if the value dropped into it is untranslated data:
   `` `${trap.save.type} ${t('save DC')}` `` → "Reflex CD del tiro salvezza".
   For each `${…}` inside translated text decide: a **name** → `tName(domain,
   value)`; **prose from `src/data`** → the prose pack; a **slug or key** →
   leave it.
6. `tName('<domain>', name)` requires that `domain` already exists in
   `names.json`. A domain that does not exist falls back to English silently
   for every name — `verify.py` gates this.
7. **A template-literal attribute is display text.** ``aria-label={`How
   ${label} works`}`` needs `tx('How {0} works', label)`. It is the shape that
   most often ends up half-translated, because the hole is filled from a call
   site that already is.
8. **A `t()` whose key is a variable** (`t(bonus.text)`) is invisible to
   `progress.py`, which lists them separately. Put **every** value it can take
   in the pack yourself, and say so in your report. A key built from a template
   — ``t(`${x} save`)`` — is worse, because the keys it can produce are a
   product of what the hole holds: prefer `tx()`, or an explicit map.
9. Add every wrapped string to `src/data/<lang>/ui.json`.
10. **Check the three things a translation quietly breaks:**
    - **Search boxes.** A filter on `c.name` searches English the reader cannot
      see. Filter on the displayed name.
    - **Sorting.** Sort on the displayed name, not the English.
    - **Plurals and gender.** `{n} items` is not `{n} oggetti` when n is 1;
      Italian inflects adjectives (*attiva* / *attivo*).
11. Watch for `t` being **shadowed** — `list.map((t) => …)` silently captures
    the translate function. Rename the parameter.
12. **Most components need no test at all.** `progress.py` reports every
    literal key missing from the pack, and `i18n.test.js` proves `t()` returns
    what the pack holds — so asserting that `t('Feats')` renders "Talenti"
    re-tests the i18n module through a component. **Never create a new test
    file just to have one**: an 18-line file proving one string is Italian is
    pure cost. Add to an *existing* test file, or write nothing.

    Write an Italian test only when the component does something no gate sees:
    - a **dynamic key** (`t(source.label)`) — cover every value it can take;
    - a value **interpolated into translated text**, to prove it goes through
      `tName` rather than arriving as bare English;
    - **search, filter or sort** on a displayed name;
    - a **plural or gender** branch;
    - a name that must **stay English** (`Aggiungi Toughness`).

    Drive the model in English, assert the screen in Italian; see
    [conditions_section.test.js](../../../src/components/player_sheet/conditions_section.test.js).
    Two or three assertions is usually the whole of it.

    **A test can freeze a defect.** One written against a half-translated
    shared component recorded `/How Palmo tremante works/i` as correct, so the
    bug had to be found by reading rather than by running. If an assertion
    mixes two languages, that is the bug — do not encode it.
13. Run the checks:
    ```bash
    CI=true npx react-scripts test --watchAll=false --testPathPattern=<name>
    python .claude/skills/translate-it/scripts/en_drift.py    # English unmoved
    python .claude/skills/translate-it/scripts/verify.py
    ```
    `en_drift.py` exits non-zero and lists any wording an English reader would
    now see differently. **Account for every line in your report.** A
    restructure — a sentence folded into one `tx()`, a shadowed parameter
    renamed — is fine and renders the same. A line that *adds or drops an
    English word* is a defect, not a restructure: `label="units"` becoming
    `t('the units')` makes an English reader see "How the units works". If the
    Italian reads better with an article, put the article in the Italian, never
    in the key.

### Display strings in `src/lib`

Code that **builds something a person reads** counts as UI and uses the same
`t()`: `utils.js`, `itemsUtils.js`, `scrolls.js`, `contributions.js`,
`conditionEffects.js`, `trapCR.js`, `trapFootprint.js`, `monsterBook.js`,
`shopShare.js`.

**Do not import i18n into a pure model or math module.** Reading the current
language makes it depend on hidden global state. Take the word as an argument
and let the component pass `t('gp')` — see `formatGp` in `lib/trap/trapMath.js`.

---

## Workflow B — a data batch

Never open `spells.json` in an editor — it is 865 KB and you need thirty
strings from it.

```bash
S=.claude/skills/translate-it/scripts

# 1. take the next slice
python $S/next_batch.py src/data/spells.json --count 30 --out /tmp/batch.json

# 2. translate every "it" field in /tmp/batch.json (leave "path" and "en" alone)

# 3. grade your own work before it touches anything
python $S/check_batch.py /tmp/batch.json

# 4. file it into the pack — src/data is never opened for writing
python $S/json_tr.py /tmp/batch.json

# 5. prove the English did not move and the pack is sound
python $S/verify.py src/data/spells.json
```

The batch hands strings out in document order, so a spell's Description, Range
and Duration arrive together — translate them as one unit.

**Progress lives in the pack.** A path with an entry is done. No ledger,
and committing changes nothing.

### What verify.py refuses

| Gate | Why it exists |
|---|---|
| **untouched** | `src/data/<file>.json` differs from `HEAD`. A translation never edits the English. |
| **paths** | A pack key no longer points at a string in the English data. |
| **scope** | A key is not on the translate list in `fields.json`. Default-deny. |
| **numbers** | A number, die or modifier went missing. `2d6` stays `2d6`. |
| **markup** | An HTML tag or an `href` changed. |
| **glossary** | A strict term came out as something other than its agreed word. |
| **name domain** | A component calls `tName()` with a domain the pack lacks. |

---

## The rules that are never bent

**Numbers, dice and modifiers are copied, never recomputed.** `1d4`, `+2`,
`DC 15`, `50%`, `01–10`. The en dash `–` in the data is not a hyphen.

**Measurements keep their number and their system.** `10 feet` → `10 piedi` ✅,
→ `3 metri` ❌. `units.js` converts at render and reads Italian unit words;
converting by hand double-converts.

**Markup is copied exactly** — `<p>`, `<i>`, `<b>`, tables, every
`<a href="skills#jump">`. An `href` is a machine address.

**Never bump `CURRENT_VERSION`.** Nothing here changes the save format.

**Add every new term to the glossary in the same change**, then
`python .claude/skills/translate-it/scripts/glossary.py --md`.

---

## Adding a language

1. `src/data/<code>/ui.json` and `names.json` (start them as `{}`).
2. Two imports and one `PACKS` entry in `src/lib/i18n/index.js`.
3. One entry in `LANGUAGES`, with the language's own name for itself.
4. Prose packs register in `src/lib/i18n/prose.js`.

Every script here takes `--lang`.

---

## Finishing

```bash
python .claude/skills/translate-it/scripts/verify.py --all    # no FAIL lines
python .claude/skills/translate-it/scripts/en_drift.py        # English unmoved
CI=true npx react-scripts test --watchAll=false               # all suites pass
npm run build                                                 # compiles
```

Baseline: **127 suites, 2088 tests, 4 pre-existing build warnings**
(`loot_inventory`, `ShopInventory` ×2, `spellbook_table`). A new warning is
yours.

You cannot commit — this project allows read-only git. Say which files are
ready and let the user commit.

---

## Reference

The conditions feature is the worked example and touches all three layers:
[tables.json](../../../src/data/it/tables.json) (prose),
[names.json](../../../src/data/it/names.json) (names),
[conditions_section.jsx](../../../src/components/player_sheet/conditions_section.jsx)
and its test (component, search and sort fixes, both languages),
[i18n.test.js](../../../src/lib/i18n/i18n.test.js) (tests that keep a pack honest).

Why the design is as it is: [references/design-notes.md](references/design-notes.md).

| File | What it is |
|---|---|
| `glossary.json` | The vocabulary. The only place a term is edited. |
| `references/glossary.md` | Generated from it, for reading. |
| `references/design-notes.md` | Why the rules above exist. Not needed to run the skill. |
| `fields.json` | Which paths in `src/data` may be translated. Default-deny. |
| `scripts/next_batch.py` | Hands out the next untranslated strings. |
| `scripts/check_batch.py` | Grades a finished batch before it is filed. |
| `scripts/json_tr.py` | Files a batch into the language pack. |
| `scripts/verify.py` | The gates. |
| `scripts/en_drift.py` | Proves wrapping did not change the English. |
| `scripts/progress.py` | What is done, what is left. |
| `scripts/glossary.py` | Look terms up; regenerate the markdown. |
