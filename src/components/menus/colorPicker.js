import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAccent, selectTheme, setAccent, setTheme } from '../../store/slices/appSlice';
import { isMobile } from '../../lib/utils';
import BottomSheet from '../common/BottomSheet';
import IconButton from '../common/IconButton';

// 12 curated accent hues from the design handoff (tokens.css .accent-* classes).
// Each entry: { id: short name used in body class, swatch: oklch for the dot preview }.
const HUES = [
  { id: 'crimson',  swatch: 'oklch(0.66 0.17 22)'  },
  { id: 'brass',    swatch: 'oklch(0.74 0.13 78)'  },
  { id: 'olive',    swatch: 'oklch(0.68 0.13 110)' },
  { id: 'emerald',  swatch: 'oklch(0.66 0.13 155)' },
  { id: 'teal',     swatch: 'oklch(0.66 0.12 195)' },
  { id: 'royal',    swatch: 'oklch(0.62 0.15 260)' },
  { id: 'indigo',   swatch: 'oklch(0.58 0.15 280)' },
  { id: 'violet',   swatch: 'oklch(0.64 0.16 305)' },
  { id: 'plum',     swatch: 'oklch(0.58 0.15 335)' },
  { id: 'rose',     swatch: 'oklch(0.70 0.15 12)'  },
  { id: 'bronze',   swatch: 'oklch(0.62 0.11 55)'  },
  { id: 'slate',    swatch: 'oklch(0.55 0.03 250)' },
];

function AccentSheet({ open, onClose }) {
  const dispatch = useDispatch();
  const accent = useSelector(selectAccent);
  const theme  = useSelector(selectTheme);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      eyebrow="UI preferences"
      title="Accent & theme"
    >
      <div className="sh-stack">
        <div>
          <div className="sh-eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Accent color</div>
          <div className="sh-accent-grid">
            {HUES.map(({ id, swatch }) => (
              <button
                key={id}
                type="button"
                className={`sh-hue ${accent === id ? 'is-active' : ''}`}
                style={{ '--swatch': swatch }}
                aria-label={`Accent ${id}`}
                aria-pressed={accent === id}
                onClick={() => dispatch(setAccent(id))}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="sh-eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Theme</div>
          <div className="sh-mode-toggle">
            <button
              type="button"
              aria-pressed={theme === 'dark' ? 'true' : 'false'}
              onClick={() => dispatch(setTheme('dark'))}
            >Dark</button>
            <button
              type="button"
              aria-pressed={theme === 'light' ? 'true' : 'false'}
              onClick={() => dispatch(setTheme('light'))}
            >Parchment</button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

function AccentPopover({ open, anchorRef, onClose }) {
  const dispatch = useDispatch();
  const accent = useSelector(selectAccent);
  const theme  = useSelector(selectTheme);
  const popRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = ev => {
      if (popRef.current?.contains(ev.target)) return;
      if (anchorRef?.current?.contains(ev.target)) return;
      onClose?.();
    };
    const onKey = ev => { if (ev.key === 'Escape') onClose?.(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, anchorRef, onClose]);

  if (!open) return null;

  return (
    <div className="sh-accent-popover" ref={popRef} role="dialog" aria-label="Accent and theme">
      <div className="sh-eyebrow">Accent color</div>
      <div className="sh-accent-grid">
        {HUES.map(({ id, swatch }) => (
          <button
            key={id}
            type="button"
            className={`sh-hue ${accent === id ? 'is-active' : ''}`}
            style={{ '--swatch': swatch }}
            aria-label={`Accent ${id}`}
            aria-pressed={accent === id}
            onClick={() => dispatch(setAccent(id))}
          />
        ))}
      </div>
      <div className="sh-eyebrow" style={{ marginTop: 'var(--space-3)' }}>Theme</div>
      <div className="sh-mode-toggle" style={{ marginTop: 'var(--space-2)' }}>
        <button
          type="button"
          aria-pressed={theme === 'dark' ? 'true' : 'false'}
          onClick={() => dispatch(setTheme('dark'))}
        >Dark</button>
        <button
          type="button"
          aria-pressed={theme === 'light' ? 'true' : 'false'}
          onClick={() => dispatch(setTheme('light'))}
        >Parchment</button>
      </div>
    </div>
  );
}

/**
 * AccentPicker — the trigger button + the popover/sheet that lets the user pick
 * an accent hue and theme. Default export keeps the old `ColorPicker` import
 * working without changes in TopMenu.
 */
export default function ColorPicker() {
  const accent = useSelector(selectAccent);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const mobile = isMobile();

  const toggle = useCallback(() => setOpen(v => !v), []);

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} ref={anchorRef}>
      <IconButton
        ghost
        title={`Accent color (${accent})`}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open accent picker"
      >
        <span className="sh-accent-dot" aria-hidden="true" />
      </IconButton>

      {mobile
        ? <AccentSheet open={open} onClose={() => setOpen(false)} />
        : <div className="sh-accent-popover-anchor">
            <AccentPopover open={open} anchorRef={anchorRef} onClose={() => setOpen(false)} />
          </div>
      }
    </span>
  );
}
