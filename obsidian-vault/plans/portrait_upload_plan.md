# Portrait Upload — Implementation Plan

> Add a player portrait stored on the character. Tapping the `.sh-portrait` square in the combat-page header opens a BottomSheet editor where the user picks an image, drags it to frame, saves it; or removes an existing portrait.
>
> Scope: combat-page header card only. Mobile-first (375×667). No backend; portrait stored as a base64 data URL on the Player domain object and persisted via the existing `psc` slot in localStorage.

## Context

The header card currently shows a striped placeholder with a `badge` icon next to the character name and class filigree (see [combat_page.jsx:302-318](../../src/components/player_sheet/combat_page.jsx)). The square box is the right shape and size for a portrait. We want the user to be able to upload a personal image for each character. Because everything lives in localStorage (~5 MB budget under the single `"app"` key, compressed with lz-string), uploads must be downscaled and re-encoded client-side.

UX confirmed:
- **Container:** BottomSheet ([src/components/common/BottomSheet.jsx](../../src/components/common/BottomSheet.jsx))
- **Output:** 256×256 JPEG, quality 0.8 (~15–25 KB per portrait)
- **Remove action:** present when a portrait already exists
- **Source:** gallery + camera (`accept="image/*"`, no `capture` attr)
- **Cropping:** object-position drag, no library. Image scaled so the shorter edge fits a 1:1 viewport; user drags along the longer axis; on save the same offset is applied while drawing to a 256×256 canvas.

---

## Files

**New**
- `src/components/player_sheet/PortraitEditorSheet.jsx` — the BottomSheet editor
- `src/lib/player/portraitImage.js` — pure helpers: `decodeFile(file)`, `composePortrait({ image, offset, viewport, output })` → data URL
- `src/style/portrait_editor.css` — editor viewport + drag cursor + button layout

**Modified**
- `src/lib/player/player.js` — add `portrait` field, getter, setter, load(), serialize()
- `src/store/thunks/playerSheetThunks.js` — add `onSetCharacterPortrait(dataUrl)` and `onClearCharacterPortrait()`
- `src/components/player_sheet/combat_page.jsx` — make portrait box a button, render `<img>` when set, mount the editor
- `src/style/atoms.css` — `.sh-portrait > img { … object-fit: cover }` + button-state affordance
- `src/index.css` (or wherever style sheets are imported) — register `portrait_editor.css`

No `appState.js` changes: `psc` stores serialized Player objects whole, so a new field rides along automatically.

---

## Steps

### 1. Domain model: `Player.portrait`

**Where:** [src/lib/player/player.js](../../src/lib/player/player.js)

- Constructor (~line 109, near `selectedNoteName`): `this.portrait = '';`
- `load(data)` (~line 182, alongside `selectedNoteName` handling): guard `if (typeof data.portrait === 'string') this.portrait = data.portrait;`
- `serialize()` (~line 322, alongside `selectedNoteName`): `portrait: this.portrait || '',`
- Add `getPortrait()` returning `this.portrait || ''`
- Add `setPortrait(value)` — accept string only, empty string clears

No D&D rules involved; this is pure data.

**Verification:** in a browser console, `JSON.parse(LZString.decompressFromUTF16(localStorage.getItem('app'))).psc[0].portrait` exists as `""` after a fresh save.

---

### 2. Thunks: set / clear portrait

**Where:** [src/store/thunks/playerSheetThunks.js](../../src/store/thunks/playerSheetThunks.js)

Mirror `onSetCharacterRace` (lines 122-129). Add:
```js
export const onSetCharacterPortrait = (dataUrl) => (dispatch, getState) => { ... p.setPortrait(dataUrl); persistPlayer(...); }
export const onClearCharacterPortrait = () => (dispatch, getState) => { ... p.setPortrait(''); persistPlayer(...); }
```

No reducer/slice changes — `persistPlayer` already dispatches a refreshed Player instance.

---

### 3. Image helpers

**Where:** new `src/lib/player/portraitImage.js`

Two pure functions, no React, no Redux. Keeps canvas math out of the component (and matches the project rule "all computed values live in the domain model").

- `decodeFile(file)` — validates type (`image/*`), rejects > 10 MB, prefers `createImageBitmap(file, { imageOrientation: 'from-image' })` for correct EXIF, falls back to `<img>` + `URL.createObjectURL`. Returns `{ width, height, source }` where `source` is an `ImageBitmap` or `HTMLImageElement` (both work with `drawImage`).
- `composePortrait({ source, srcW, srcH, offset, viewport, output })` — computes the cover-fit scale, applies the user's drag offset (clamped so the image stays covering), then draws onto an offscreen 256×256 canvas and returns `canvas.toDataURL('image/jpeg', 0.8)`.

Constants in this file: `PORTRAIT_OUTPUT_SIZE = 256`, `PORTRAIT_QUALITY = 0.8`, `MAX_FILE_BYTES = 10 * 1024 * 1024`.

---

### 4. BottomSheet editor component

**Where:** new `src/components/player_sheet/PortraitEditorSheet.jsx`

Props: `{ open, onClose, currentPortrait, onSave, onRemove }`.

Internal state machine:
- `empty` — no file picked, no current portrait. Shows "Choose image" button.
- `previewing-current` — `currentPortrait` truthy, user hasn't picked a new file. Shows current image, "Replace" and "Remove" buttons.
- `editing` — a file was picked. Shows the 1:1 drag viewport, "Save" + "Choose another" + "Cancel" buttons.

Implementation notes:
- Hidden `<input type="file" accept="image/*" ref={inputRef}>` triggered by buttons.
- 1:1 viewport sized via CSS: `width: min(80vw, 20rem); aspect-ratio: 1;`.
- Drag handled with pointer events on the viewport (`onPointerDown` → `setPointerCapture` → `onPointerMove` updates offset → `onPointerUp` releases). One `useState({ x, y })` for the offset, clamped on each update so the displayed image's edges never enter the viewport.
- On save: call `composePortrait(...)` with the same `offset`, `viewport size`, and `output size` constants, then `onSave(dataUrl)`.
- Reuses BottomSheet's built-in Escape / scrim close.

This component owns no Redux — parent passes `onSave` / `onRemove` callbacks.

---

### 5. Wire the header card

**Where:** [src/components/player_sheet/combat_page.jsx](../../src/components/player_sheet/combat_page.jsx)

Around lines 302-318:
- `const [portraitOpen, setPortraitOpen] = useState(false);`
- `const portrait = player.getPortrait?.() ?? '';`
- Change `<div className="sh-portrait" aria-hidden>` to `<button type="button" className="sh-portrait" onClick={() => setPortraitOpen(true)} aria-label="Edit portrait">`. When `portrait` truthy: render `<img src={portrait} alt="" className="sh-portrait-img" />`; otherwise render the existing `<Icon name="badge" />`.
- Mount `<PortraitEditorSheet open={portraitOpen} onClose={() => setPortraitOpen(false)} currentPortrait={portrait} onSave={(d) => { dispatch(onSetCharacterPortrait(d)); setPortraitOpen(false); }} onRemove={() => { dispatch(onClearCharacterPortrait()); setPortraitOpen(false); }} />` somewhere inside the wrap.

---

### 6. CSS

**Where:** [src/style/atoms.css](../../src/style/atoms.css) around the existing `.sh-portrait` block (lines 749-762).

- Add `.sh-portrait > img.sh-portrait-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }`
- Make `button.sh-portrait` look identical to the div: reset border (already has 1px), `background: transparent` so the striped gradient still shows, `padding: 0`, `cursor: pointer`. Add `:focus-visible` outline using existing tokens.

New file [src/style/portrait_editor.css](../../src/style/portrait_editor.css):
- `.portrait-editor-viewport { position: relative; width: min(80vw, 20rem); aspect-ratio: 1; margin: 0 auto; border-radius: var(--radius-md); overflow: hidden; touch-action: none; background: var(--surface-2); }`
- `.portrait-editor-viewport img { position: absolute; user-select: none; pointer-events: none; transform-origin: top left; }`
- `.portrait-editor-viewport[data-dragging="true"] { cursor: grabbing; }`
- Button row: flex, gap `var(--space-2)`, wrap, top margin `var(--space-3)`.

Register the new stylesheet wherever other player-sheet CSS is imported (check `src/index.css` and follow the existing pattern, e.g. how `money_card.css` was added in this branch).

---

## Verification

Manual, in Chrome DevTools at 375×667 mobile emulation:

1. Hard reload. Open the player sheet → combat page. Portrait box shows the striped placeholder + badge icon. Tap it → BottomSheet opens in `empty` state.
2. Pick a tall portrait photo. Viewport shows it scaled to fit the shorter edge; drag vertically — image moves and stays edge-to-edge. Save. BottomSheet closes; header now shows the cropped portrait.
3. Reload the page. Portrait persists.
4. In console: `JSON.parse(LZString.decompressFromUTF16(localStorage.getItem('app'))).psc[<idx>].portrait` is a `data:image/jpeg;base64,…` string of roughly 15–35 KB. Compare `localStorage.getItem('app').length` before and after to confirm the added storage cost.
5. Pick a landscape image — drag horizontally — save. Confirm crop matches what was previewed.
6. Reopen the editor on a character with a portrait — `previewing-current` state. Tap "Remove" → header reverts to placeholder; reload page → still empty.
7. Try a > 10 MB file → editor refuses with an inline error and does not OOM.
8. iPhone Safari (or simulated iOS) — pick a HEIC photo from a recent device → it decodes via `createImageBitmap` and saves as JPEG.
9. EXIF-rotated JPEG (older Android photo) → decoded with correct orientation thanks to `imageOrientation: 'from-image'`.

---

## Out of scope

- Portrait gallery / multiple portraits per character
- Filters, rotation, zoom controls
- Sharing portraits across the QR shop-share flow
- Migrating any existing data (there is no existing portrait data)
