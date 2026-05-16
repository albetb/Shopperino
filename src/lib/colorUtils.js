// Neutered: --main/--main-t/--main-t2 are now aliased to --accent/--accent-muted/--accent-soft
// in src/style/App.css. Theming is driven by body.theme-* + body.accent-* classes, set by
// App.jsx from Redux state. This function only clears any legacy inline overrides that may
// have been written by older builds. The hex/darken/alpha helpers below remain exported for
// any incidental callers; new code should use the accent token system instead.
export function applyColors(_mainHex) {
  const root = document.documentElement.style;
  root.removeProperty('--main');
  root.removeProperty('--main-t');
  root.removeProperty('--main-t2');
}


function normalizeHex(hex) {
  if (!hex) return null;
  hex = hex.trim().replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(ch => ch + ch).join('');
  }
  if (hex.length !== 6) return null;
  return hex.toLowerCase();
}

export function hexToRgb(hex) {
  const n = normalizeHex(hex);
  if (!n) return null;
  const r = parseInt(n.slice(0,2), 16);
  const g = parseInt(n.slice(2,4), 16);
  const b = parseInt(n.slice(4,6), 16);
  return { r, g, b };
}

export function rgbToHex({ r, g, b }) {
  const toHex = v => {
    const s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
    return s.length === 1 ? '0' + s : s;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

// Darken by percent (0-100). percent=10 => reduce brightness by 10%
export function darkenHex(hex, percent = 10) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const factor = (100 - percent) / 100;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  return rgbToHex({ r, g, b });
}

// Append alpha suffix to a 6-digit hex producing 8-digit hex (#RRGGBBAA)
export function hexWithAlpha(hex, alphaSuffix) {
  const n = normalizeHex(hex);
  if (!n) return null;
  // alphaSuffix should be two hex characters (e.g. 'b3' or '43')
  return `#${n}${alphaSuffix}`.toLowerCase();
}
