/*
  Spellbook Row-Action Controls — reference implementation
  =========================================================
  Three small React controls for the leftmost action cell of a spell row.
  These are DESIGN REFERENCES extracted from the HTML prototype. Recreate
  them in your codebase using your own conventions (these are plain,
  dependency-free React function components and should port directly).

  Requires the CSS in `controls.css` and the design tokens it depends on
  (--ink, --accent, --surface-*, --border*, --radius-*, --t-*, fonts).

  The Star Orbit control renders Material Symbols star glyphs, so the
  Material Symbols Outlined font must be loaded (see README).
*/

import { useState } from 'react';

/* ============================================================
   1. LEARN — Sliding Tab
   Toggle, one-shot per spell. Bookmark rooted in the row whose
   pointed tip slides OUT to the left when learned, IN when not.
   - props: learned (bool), disabled (bool), onClick ()
   ============================================================ */
export function LearnTab({ learned = false, disabled = false, onClick }) {
  return (
    <button
      type="button"
      className={
        'tab-learn' +
        (learned ? ' is-learned' : '') +
        (disabled ? ' is-disabled' : '')
      }
      aria-pressed={learned}
      aria-label={learned ? 'Unlearn spell' : 'Learn spell'}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="tab-shape" />
      <span className="tab-glyph">{learned ? '✓' : '+'}</span>
      <span className="dog-ear" aria-hidden>
        <svg width="9" height="9" viewBox="0 0 9 9">
          <path d="M0 0 L9 0 L9 9 Z" fill="var(--bg-elev)" stroke="var(--accent-strong)" strokeWidth="0.7" />
          <path d="M0 0 L9 9" stroke="var(--accent-strong)" strokeWidth="0.6" />
        </svg>
      </span>
    </button>
  );
}

/* ============================================================
   2. PREPARE — Fused Stepper
   −  N  +  fused into one pill. Increments/decrements prepared
   copies of a spell. MAX IS 9 (changed from earlier drafts).
   − is disabled at min; + is disabled at max (9).
   - props: value (number), min (default 0), max (default 9),
            disabled (bool), onChange (nextValue)
   ============================================================ */
export function FusedStepper({ value = 0, min = 0, max = 9, disabled = false, onChange }) {
  const dec = () => !disabled && value > min && onChange?.(value - 1);
  const inc = () => !disabled && value < max && onChange?.(value + 1);
  return (
    <div className={'fused-stepper' + (disabled ? ' is-disabled' : '')}>
      <button type="button" onClick={dec} disabled={value <= min} aria-label="Prepare one less">−</button>
      <span className="num">{value}</span>
      <button type="button" onClick={inc} disabled={value >= max} aria-label="Prepare one more">+</button>
    </div>
  );
}

/* ============================================================
   3. CAST — Star Orbit (experimental)
   A central remaining-count ringed by Material star icons, one
   star per remaining use, MAX 9 stars. The ring is STILL at rest;
   on each cast it turns briefly by one step (right after a star is
   removed) via the temporary `.casting` class, then settles.
   Disabled when remaining <= 0.
   - props: remaining (number), total (number, for a11y label),
            onClick () — caller decrements `remaining`
   ============================================================ */
export function StarOrbitCast({ remaining = 0, total = 3, onClick }) {
  const empty = remaining <= 0;
  const n = Math.min(Math.max(remaining, 0), 9); // cap rendered stars at 9
  const [casting, setCasting] = useState(false);

  const handleClick = (e) => {
    if (empty) return;
    // Brief one-shot orbit nudge that plays right after a star is spent.
    setCasting(true);
    setTimeout(() => setCasting(false), 340); // must exceed --t-slow (320ms)
    onClick?.(e);
  };

  return (
    <button
      type="button"
      className={'orbit-cast' + (empty ? ' is-empty' : '') + (casting ? ' casting' : '')}
      aria-label={empty ? 'No slots remaining' : `Cast spell (${remaining} of ${total} left)`}
      disabled={empty}
      onClick={handleClick}
      style={{ ['--star-count']: n || 1 }}
    >
      <span className="orbit-path" aria-hidden />
      <span className="ring" aria-hidden>
        {Array.from({ length: n }).map((_, i) => (
          <span key={i} className="star" style={{ ['--a']: `${(360 / n) * i}deg` }}>
            <span className="material-symbols-outlined">star</span>
          </span>
        ))}
      </span>
      <span className="orbit-num">{remaining}</span>
    </button>
  );
}
